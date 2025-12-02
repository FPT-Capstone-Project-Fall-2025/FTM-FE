import { MarkerType, type Node, type Edge } from 'reactflow';
import * as d3 from 'd3';
import type { FamilytreeDataResponse, FamilyMember } from '@/types/familytree';

interface ChildrenGroup {
  key: string; // partnerId
  value: string[]; // childIds
}

interface D3TreeNode {
  id: string;
  children?: D3TreeNode[];
}

// Helper: Climb upward to find a top-level ancestor (node with no parents)
function findTopAncestor(
  startId: string,
  parentsOf: Map<string, Set<string>>
): string {
  let current = startId;
  const visited = new Set<string>();
  while (true) {
    if (visited.has(current)) break;
    visited.add(current);
    const parents = parentsOf.get(current);
    if (!parents || parents.size === 0) break;
    current = Array.from(parents)[0]!;
  }
  return current;
}

// Helper: Get all nodes in the connected component reachable from startId
function getConnectedComponent(
  startId: string,
  members: Record<string, FamilyMember>,
  parentsOf: Map<string, Set<string>>,
  childrenOf: Map<string, string[]>
): Set<string> {
  const visited = new Set<string>();
  const stack: string[] = [startId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    parentsOf.get(id)!.forEach(p => stack.push(p));
    childrenOf.get(id)?.forEach(c => stack.push(c));
    members[id]?.partners?.forEach(p => stack.push(p));
  }
  return visited;
}

export function mapFamilyDataToFlow(response: FamilytreeDataResponse) {
  const members: Record<string, FamilyMember> = Object.fromEntries(
    response.datalist.map(item => [item.key, item.value])
  );

  if (Object.keys(members).length === 0) {
    return { nodes: [], edges: [], members: {} };
  }

  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, Set<string>>();
  const partnerPairs = new Set<string>();

  // NEW: Track which partner each child belongs to for polygamy cases
  const childToPartnerMap = new Map<string, { parent: string; partner: string }>();

  Object.keys(members).forEach(memberId => {
    childrenOf.set(memberId, []);
    parentsOf.set(memberId, new Set());
  });

  Object.entries(members).forEach(([memberId, member]) => {
    if (member.children && Array.isArray(member.children)) {
      member.children.forEach((childGroup: ChildrenGroup) => {
        const partnerId = childGroup.key;
        const childIds = childGroup.value || [];

        childIds.forEach(childId => {
          if (!members[childId]) return;

          // NEW: Track which partner this child came from
          if (partnerId && members[partnerId]) {
            childToPartnerMap.set(childId, { parent: memberId, partner: partnerId });
          }

          if (!childrenOf.get(memberId)!.includes(childId)) {
            childrenOf.get(memberId)!.push(childId);
          }
          parentsOf.get(childId)!.add(memberId);

          if (partnerId && members[partnerId]) {
            parentsOf.get(childId)!.add(partnerId);
            if (!childrenOf.get(partnerId)!.includes(childId)) {
              childrenOf.get(partnerId)!.push(childId);
            }
          }
        });

        if (partnerId && partnerId !== memberId && members[partnerId]) {
          const pair = [memberId, partnerId].sort().join('-');
          partnerPairs.add(pair);
        }
      });
    }
  });

  const root = members[response.root] ? response.root : Object.keys(members)[0];
  if (!root) {
    return { nodes: [], edges: [], members: {} };
  }

  const component = getConnectedComponent(root, members, parentsOf, childrenOf);
  const d3Root = findTopAncestor(root, parentsOf);

  const generationMap = new Map<string, number>();
  const queue: Array<[string, number]> = [[d3Root, 0]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [memberId, gen] = queue.shift()!;
    if (visited.has(memberId) || !members[memberId] || !component.has(memberId))
      continue;
    visited.add(memberId);

    generationMap.set(memberId, gen);

    const children = (childrenOf.get(memberId) || []).filter(
      cId => members[cId] && component.has(cId)
    );
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push([childId, gen + 1]);
      }
    });

    const member = members[memberId];
    if (member?.partners && Array.isArray(member.partners)) {
      member.partners.forEach(partnerId => {
        if (
          !visited.has(partnerId) &&
          members[partnerId] &&
          component.has(partnerId)
        ) {
          queue.push([partnerId, gen]);
        }
      });
    }
  }

  component.forEach(memberId => {
    if (!generationMap.has(memberId)) {
      const member = members[memberId];
      let assignedGen: number | null = null;

      const children = (childrenOf.get(memberId) || []).filter(
        cId => members[cId] && component.has(cId)
      );
      for (const childId of children) {
        if (generationMap.has(childId)) {
          assignedGen = generationMap.get(childId)! - 1;
          break;
        }
      }

      if (assignedGen === null && member?.partners) {
        for (const partnerId of member.partners) {
          if (
            generationMap.has(partnerId) &&
            members[partnerId] &&
            component.has(partnerId)
          ) {
            assignedGen = generationMap.get(partnerId)!;
            break;
          }
        }
      }

      generationMap.set(memberId, assignedGen ?? 0);
    }
  });

  function buildD3Tree(
    nodeId: string,
    visited: Set<string>
  ): D3TreeNode | null {
    if (!members[nodeId] || visited.has(nodeId) || !component.has(nodeId)) {
      return null;
    }
    visited.add(nodeId);

    const node: D3TreeNode = { id: nodeId };
    const children = (childrenOf.get(nodeId) || []).filter(
      cId => members[cId] && component.has(cId)
    );

    if (children.length > 0) {
      const validChildren = children
        .map(childId => buildD3Tree(childId, visited))
        .filter((child): child is D3TreeNode => child !== null);

      if (validChildren.length > 0) {
        node.children = validChildren;
      }
    }

    return node;
  }

  const d3RootNode = buildD3Tree(d3Root, new Set());

  if (!d3RootNode) {
    return { nodes: [], edges: [], members: {} };
  }

  const treeLayout = d3
    .tree<D3TreeNode>()
    .nodeSize([280, 320])
    .separation((a, b) => {
      return a.parent === b.parent ? 1 : 1.5;
    });

  const hierarchy = d3.hierarchy(d3RootNode);
  const treeData = treeLayout(hierarchy);

  const positionMap = new Map<string, { x: number; y: number }>();

  treeData.descendants().forEach(node => {
    positionMap.set(node.data.id, {
      x: node.x,
      y: node.y,
    });
  });

  const partnersProcessed = new Set<string>();

  Object.entries(members).forEach(([memberId, member]) => {
    if (!component.has(memberId)) return;
    if (!member.partners || !Array.isArray(member.partners)) return;

    const memberPos = positionMap.get(memberId);
    if (!memberPos) return;

    const validPartners = member.partners.filter(
      pId => members[pId] && component.has(pId)
    );

    validPartners.forEach(partnerId => {
      const pairKey = [memberId, partnerId].sort().join('-');
      if (partnersProcessed.has(pairKey)) return;
      partnersProcessed.add(pairKey);

      const partnerPos = positionMap.get(partnerId);

      if (!partnerPos) {
        positionMap.set(partnerId, {
          x: memberPos.x + 200,
          y: memberPos.y,
        });
      } else {
        const centerX = (memberPos.x + partnerPos.x) / 2;
        const avgY = (memberPos.y + partnerPos.y) / 2;

        positionMap.set(memberId, {
          x: centerX - 100,
          y: avgY,
        });
        positionMap.set(partnerId, {
          x: centerX + 100,
          y: avgY,
        });
      }
    });
  });

  parentsOf.forEach((parentIds, childId) => {
    if (!component.has(childId) || !members[childId]) return;

    const parents = Array.from(parentIds).filter(
      pId => members[pId] && component.has(pId)
    );
    if (parents.length !== 2) return;

    const parent1Pos = positionMap.get(parents[0]!);
    const parent2Pos = positionMap.get(parents[1]!);
    const childPos = positionMap.get(childId);

    if (!parent1Pos || !parent2Pos || !childPos) return;

    const parentCenterX = (parent1Pos.x + parent2Pos.x) / 2;

    const siblings = Array.from(parentsOf.entries())
      .filter(([_, pIds]) => {
        const pArray = Array.from(pIds).sort();
        return (
          pArray.length === 2 &&
          pArray[0] === parents[0] &&
          pArray[1] === parents[1]
        );
      })
      .map(([sibId, _]) => sibId)
      .filter(sibId => members[sibId] && component.has(sibId));

    const siblingSpacing = 250;
    const totalWidth = (siblings.length - 1) * siblingSpacing;
    const startX = parentCenterX - totalWidth / 2;

    siblings.forEach((siblingId, index) => {
      const sibPos = positionMap.get(siblingId);
      if (sibPos) {
        positionMap.set(siblingId, {
          x: startX + index * siblingSpacing,
          y: sibPos.y,
        });
      }
    });
  });

  component.forEach(memberId => {
    if (!positionMap.has(memberId)) {
      const gen = generationMap.get(memberId) || 0;
      positionMap.set(memberId, {
        x: 0,
        y: gen * 320,
      });
    }
  });

  // Step 7: Enhanced spouse positioning with polygamy awareness
  const MIN_FAMILY_SPACING = 400;
  const SPOUSE_SPACING = 220;

  const nodesByGen = new Map<number, string[]>();

  generationMap.forEach((gen, id) => {
    if (component.has(id)) {
      const list = nodesByGen.get(gen) || [];
      list.push(id);
      nodesByGen.set(gen, list);
    }
  });

  for (const [_, nodeIds] of nodesByGen) {
    const spouseGraph = new Map<string, Set<string>>();
    nodeIds.forEach(id => spouseGraph.set(id, new Set()));

    Object.entries(members).forEach(([memberId, member]) => {
      if (!nodeIds.includes(memberId)) return;
      if (!member.partners || !Array.isArray(member.partners)) return;

      member.partners.forEach(partnerId => {
        if (nodeIds.includes(partnerId)) {
          spouseGraph.get(memberId)!.add(partnerId);
          spouseGraph.get(partnerId)!.add(memberId);
        }
      });
    });

    const visited = new Set<string>();
    const spouseClusters: string[][] = [];

    nodeIds.forEach(startId => {
      if (visited.has(startId)) return;

      const cluster: string[] = [];
      const queue = [startId];

      while (queue.length > 0) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        cluster.push(id);

        spouseGraph.get(id)!.forEach(spouseId => {
          if (!visited.has(spouseId)) {
            queue.push(spouseId);
          }
        });
      }

      spouseClusters.push(cluster);
    });

    spouseClusters.forEach(cluster => {
      const avgX =
        cluster.reduce((sum, id) => sum + positionMap.get(id)!.x, 0) /
        cluster.length;
      (cluster as any).avgX = avgX;
    });

    spouseClusters.sort((a, b) => (a as any).avgX - (b as any).avgX);

    spouseClusters.forEach(cluster => {
      const originalAvgX = (cluster as any).avgX;

      if (cluster.length === 1) {
        positionMap.set(cluster[0]!, {
          x: originalAvgX,
          y: positionMap.get(cluster[0]!)!.y,
        });
      } else if (cluster.length === 2) {
        const [id1, id2] = cluster.sort(
          (a, b) => positionMap.get(a)!.x - positionMap.get(b)!.x
        );
        const clusterWidth = SPOUSE_SPACING;
        const startX = originalAvgX - clusterWidth / 2;

        positionMap.set(id1!, {
          x: startX,
          y: positionMap.get(id1!)!.y,
        });
        positionMap.set(id2!, {
          x: startX + SPOUSE_SPACING,
          y: positionMap.get(id2!)!.y,
        });
      } else {
        let centerPerson = cluster[0]!;
        let maxSpouses = 0;

        cluster.forEach(id => {
          const spouseCount = spouseGraph.get(id)!.size;
          if (spouseCount > maxSpouses) {
            maxSpouses = spouseCount;
            centerPerson = id;
          }
        });

        const spouses = Array.from(spouseGraph.get(centerPerson)!).filter(id =>
          cluster.includes(id)
        );

        spouses.sort((a, b) => positionMap.get(a)!.x - positionMap.get(b)!.x);

        const totalWidth = spouses.length * SPOUSE_SPACING;
        const startX = originalAvgX - totalWidth / 2;

        const centerIndex = Math.floor(spouses.length / 2);
        positionMap.set(centerPerson, {
          x: startX + centerIndex * SPOUSE_SPACING,
          y: positionMap.get(centerPerson)!.y,
        });

        spouses.forEach((spouseId, idx) => {
          let xPos: number;
          if (idx < centerIndex) {
            xPos = startX + idx * SPOUSE_SPACING;
          } else {
            xPos = startX + (idx + 1) * SPOUSE_SPACING;
          }

          positionMap.set(spouseId, {
            x: xPos,
            y: positionMap.get(spouseId)!.y,
          });
        });
      }
    });

    let cumulativeShift = 0;
    for (let i = 1; i < spouseClusters.length; i++) {
      const prevCluster = spouseClusters[i - 1]!;
      const currCluster = spouseClusters[i]!;

      const prevMaxX = Math.max(
        ...prevCluster.map(id => positionMap.get(id)!.x)
      );
      const currMinX = Math.min(
        ...currCluster.map(id => positionMap.get(id)!.x)
      );

      const gap = currMinX - prevMaxX;

      if (gap < MIN_FAMILY_SPACING / 2) {
        const nudge = MIN_FAMILY_SPACING / 2 - gap + 80;
        cumulativeShift += nudge;

        for (let j = i; j < spouseClusters.length; j++) {
          spouseClusters[j]?.forEach(id => {
            const pos = positionMap.get(id)!;
            positionMap.set(id, { x: pos.x + nudge, y: pos.y });
          });
        }
      }
    }
  }

  // Step 8: CRITICAL - Enhanced children positioning with proper polygamy handling
  const sortedGens = Array.from(nodesByGen.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedGens.length - 1; i++) {
    const currentGen = sortedGens[i]!;
    const nextGen = sortedGens[i + 1]!;

    const currentGenNodes = nodesByGen.get(currentGen) || [];
    const nextGenNodes = nodesByGen.get(nextGen) || [];

    if (nextGenNodes.length === 0) continue;

    // NEW: Group children by SPECIFIC partner, not just parent pair
    const childrenByPartnerKey = new Map<string, string[]>();

    nextGenNodes.forEach(childId => {
      const partnerInfo = childToPartnerMap.get(childId);

      if (partnerInfo) {
        // This child came from a specific parent-partner combination
        const { parent, partner } = partnerInfo;
        const key = [parent, partner].sort().join('-');

        if (!childrenByPartnerKey.has(key)) {
          childrenByPartnerKey.set(key, []);
        }
        childrenByPartnerKey.get(key)!.push(childId);
      } else {
        // Fallback to old method
        const parentIds = Array.from(parentsOf.get(childId) || []).filter(
          pId => members[pId] && component.has(pId) && currentGenNodes.includes(pId)
        );

        if (parentIds.length > 0) {
          const key = parentIds.sort().join('-');
          if (!childrenByPartnerKey.has(key)) {
            childrenByPartnerKey.set(key, []);
          }
          childrenByPartnerKey.get(key)!.push(childId);
        }
      }
    });

    // Identify polygamous parents
    const polygamousParents = new Map<string, string[]>();
    currentGenNodes.forEach(personId => {
      const person = members[personId];
      if (person?.partners && person.partners.length > 1) {
        const validPartners = person.partners.filter(
          p => members[p] && component.has(p) && currentGenNodes.includes(p)
        );
        if (validPartners.length > 1) {
          // Sort partners by their X position
          validPartners.sort((a, b) => {
            const posA = positionMap.get(a);
            const posB = positionMap.get(b);
            return (posA?.x || 0) - (posB?.x || 0);
          });
          polygamousParents.set(personId, validPartners);
        }
      }
    });

    // Create sibling groups
    const siblingGroups: Array<{
      key: string;
      children: string[];
      parentIds: string[];
      centerX: number;
      isPolygamy: boolean;
      polygamyIndex?: number;
      totalPolygamyBranches?: number;
    }> = [];

    childrenByPartnerKey.forEach((children, key) => {
      const parentIds = key.split('-').filter(id => members[id]);
      if (parentIds.length === 0) return;

      const parentPositions = parentIds
        .map(id => positionMap.get(id))
        .filter(pos => pos !== undefined) as { x: number; y: number }[];

      if (parentPositions.length === 0) return;

      const baseCenterX =
        parentPositions.reduce((sum, pos) => sum + pos.x, 0) /
        parentPositions.length;

      // Check if this is a polygamy branch
      let isPolygamy = false;
      let polygamyIndex: number | undefined;
      let totalPolygamyBranches: number | undefined;

      if (parentIds.length === 2) {
        const [p1, p2] = parentIds;
        if (polygamousParents.has(p1!)) {
          isPolygamy = true;
          const partners = polygamousParents.get(p1!)!;
          polygamyIndex = partners.indexOf(p2!);
          totalPolygamyBranches = partners.length;
        } else if (polygamousParents.has(p2!)) {
          isPolygamy = true;
          const partners = polygamousParents.get(p2!)!;
          polygamyIndex = partners.indexOf(p1!);
          totalPolygamyBranches = partners.length;
        }
      }

      siblingGroups.push({
        key,
        children,
        parentIds,
        centerX: baseCenterX,
        isPolygamy,
        polygamyIndex,
        totalPolygamyBranches,
      });
    });

    // Sort by center X
    siblingGroups.sort((a, b) => a.centerX - b.centerX);

    // Position groups with MASSIVE spacing for polygamy
    const NORMAL_SPACING = 250;
    const POLYGAMY_BRANCH_SPACING = 800; // MUCH larger spacing between polygamy branches
    const CHILD_SPACING = 280;

    siblingGroups.forEach((group, idx) => {
      const sortedChildren = [...group.children].sort((a, b) => {
        const posA = positionMap.get(a);
        const posB = positionMap.get(b);
        return (posA?.x || 0) - (posB?.x || 0);
      });

      const totalWidth = (sortedChildren.length - 1) * CHILD_SPACING;
      let targetCenterX = group.centerX;

      // Apply spacing logic
      if (idx > 0) {
        const prevGroup = siblingGroups[idx - 1]!;
        const prevChildren = prevGroup.children;

        const prevRightX = Math.max(
          ...prevChildren.map(id => positionMap.get(id)?.x || -Infinity)
        );

        const currLeftX = targetCenterX - totalWidth / 2;
        const gap = currLeftX - prevRightX;

        // Use much larger spacing if either group is a polygamy branch
        const requiredGap = (group.isPolygamy || prevGroup.isPolygamy)
          ? POLYGAMY_BRANCH_SPACING
          : NORMAL_SPACING;

        if (gap < requiredGap) {
          const shift = requiredGap - gap + 100;
          targetCenterX += shift;
        }
      }

      // Position children
      const startX = targetCenterX - totalWidth / 2;

      sortedChildren.forEach((childId, index) => {
        const childPos = positionMap.get(childId);
        if (childPos) {
          positionMap.set(childId, {
            x: startX + index * CHILD_SPACING,
            y: childPos.y,
          });
        }
      });
    });
  }

  const flowNodes: Node[] = Object.entries(members)
    .filter(([memberId]) => component.has(memberId))
    .map(([memberId, member]) => {
      const pos = positionMap.get(memberId) || { x: 0, y: 0 };

      const isDivorced = (member as any)?.isDivorced;

      return {
        id: memberId,
        type: 'familyMember',
        data: {
          ...member,
          label: member.name || 'Unknown',
          isDivorced,
        },
        position: pos,
        style: {
          minWidth: '180px',
          border: isDivorced ? '2px dashed #9ca3af' : undefined,
          opacity: isDivorced ? 0.85 : 1,
        },
      };
    });

  const flowEdges: Edge[] = [];
  const processedChildEdges = new Set<string>();

  const polygamyColors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
  ];

  const polygamyMap = new Map<string, string[]>();

  Object.entries(members).forEach(([memberId, member]) => {
    if (!component.has(memberId)) return;
    if (member.partners && member.partners.length > 1) {
      const validPartners = member.partners.filter(p => members[p] && component.has(p));
      if (validPartners.length > 1) {
        polygamyMap.set(memberId, validPartners);
      }
    }
  });

  const parentPairColors = new Map<string, string>();

  polygamyMap.forEach((partners, centerId) => {
    partners.forEach((partnerId, index) => {
      const pairKey = [centerId, partnerId].sort().join('-');
      parentPairColors.set(pairKey, polygamyColors[index % polygamyColors.length]!);
    });
  });

  parentsOf.forEach((parentIds, childId) => {
    if (!component.has(childId) || !members[childId]) return;
    const parents = Array.from(parentIds).filter(
      p => members[p] && component.has(p)
    );

    let edgeColor = '#94a3b8';

    if (parents.length === 2) {
      const pairKey = parents.sort().join('-');
      const isPolygamy = parents.some(p => polygamyMap.has(p));

      if (isPolygamy && parentPairColors.has(pairKey)) {
        edgeColor = parentPairColors.get(pairKey)!;
      }
    }

    parents.forEach(parentId => {
      const edgeId = `child-${parentId}-${childId}`;
      if (!processedChildEdges.has(edgeId)) {
        processedChildEdges.add(edgeId);
        flowEdges.push({
          id: edgeId,
          source: parentId,
          target: childId,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: edgeColor,
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
          },
        });
      }
    });
  });

  const processedPartnerPairs = new Set<string>();

  Object.entries(members).forEach(([memberId, member]) => {
    if (!component.has(memberId)) return;
    if (!member.partners || !Array.isArray(member.partners)) return;

    member.partners.forEach(partnerId => {
      if (!members[partnerId] || !component.has(partnerId)) return;

      const pair = [memberId, partnerId].sort().join('-');

      if (!processedPartnerPairs.has(pair)) {
        processedPartnerPairs.add(pair);

        const member1 = members[memberId];
        const member2 = members[partnerId];
        const isDivorced = (member1 as any)?.isDivorced || (member2 as any)?.isDivorced;

        flowEdges.push({
          id: `partner-${pair}`,
          source: memberId,
          target: partnerId,
          type: 'straight',
          animated: false,
          style: {
            stroke: isDivorced ? '#9ca3af' : '#e879f9',
            strokeWidth: 2,
            strokeDasharray: isDivorced ? '10,5' : '5,5',
            opacity: isDivorced ? 0.5 : 1,
          },
        });
      }
    });
  });

  return {
    nodes: flowNodes,
    edges: flowEdges,
    members,
  };
}