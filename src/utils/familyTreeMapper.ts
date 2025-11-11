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

  // Step 7: Group spouse clusters and separate different families - Conform to D3 by preserving original cluster centers
  const MIN_FAMILY_SPACING = 350; // Buffer for nudging only if overlaps
  const SPOUSE_SPACING = 200; // Internal cluster spacing, close to D3 nodeSize[0]/1.4 for compatibility

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

    // Calculate original avgX from D3 for each cluster (preserve D3 positioning)
    spouseClusters.forEach(cluster => {
      const avgX =
        cluster.reduce((sum, id) => sum + positionMap.get(id)!.x, 0) /
        cluster.length;
      (cluster as any).avgX = avgX;
    });

    // Sort by original avgX to check for overlaps later
    spouseClusters.sort((a, b) => (a as any).avgX - (b as any).avgX);

    // Reposition WITHIN clusters around their original D3 avgX (no cumulative shift)
    spouseClusters.forEach(cluster => {
      const originalAvgX = (cluster as any).avgX;
      const clusterWidth = (cluster.length - 1) * SPOUSE_SPACING;
      const startX = originalAvgX - clusterWidth / 2;

      if (cluster.length === 1) {
        positionMap.set(cluster[0]!, {
          x: originalAvgX,
          y: positionMap.get(cluster[0]!)!.y,
        });
      } else if (cluster.length === 2) {
        const [id1, id2] = cluster.sort(
          (a, b) => positionMap.get(a)!.x - positionMap.get(b)!.x
        );
        positionMap.set(id1!, {
          x: startX,
          y: positionMap.get(id1!)!.y,
        });
        positionMap.set(id2!, {
          x: startX + SPOUSE_SPACING,
          y: positionMap.get(id2!)!.y,
        });
      } else {
        // Symmetric positioning for >2
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

        const numLeft = Math.floor(spouses.length / 2);
        const numRight = spouses.length - numLeft;
        const centerIndex = numLeft;

        positionMap.set(centerPerson, {
          x: startX + centerIndex * SPOUSE_SPACING,
          y: positionMap.get(centerPerson)!.y,
        });

        for (let i = 0; i < numLeft; i++) {
          positionMap.set(spouses[i]!, {
            x: startX + (centerIndex - 1 - i) * SPOUSE_SPACING,
            y: positionMap.get(spouses[i]!)!.y,
          });
        }

        for (let i = 0; i < numRight; i++) {
          positionMap.set(spouses[numLeft + i]!, {
            x: startX + (centerIndex + 1 + i) * SPOUSE_SPACING,
            y: positionMap.get(spouses[numLeft + i]!)!.y,
          });
        }
      }
    });

    // Collision avoidance: Nudge overlapping clusters rightward if needed (preserves D3 order)
    for (let i = 1; i < spouseClusters.length; i++) {
      const prevCluster = spouseClusters[i - 1]!;
      const currCluster = spouseClusters[i]!;

      const prevMaxX = Math.max(
        ...prevCluster.map(id => positionMap.get(id)!.x)
      );
      const currMinX = Math.min(
        ...currCluster.map(id => positionMap.get(id)!.x)
      );

      if (currMinX - prevMaxX < MIN_FAMILY_SPACING / 2) {
        const nudge = MIN_FAMILY_SPACING / 2 - (currMinX - prevMaxX) + 50;
        currCluster?.forEach(id => {
          const pos = positionMap.get(id)!;
          positionMap.set(id, { x: pos.x + nudge, y: pos.y });
        });
      }
    }
  }

  // Step 8: CRITICAL - Recursively recenter ALL children under their parents (top-down for hierarchy)
  // This must run AFTER Step 7 completes all spouse positioning
  const sortedGens = Array.from(nodesByGen.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedGens.length - 1; i++) {
    const currentGen = sortedGens[i]!;
    const nextGen = sortedGens[i + 1]!;

    const currentGenNodes = nodesByGen.get(currentGen) || [];
    const nextGenNodes = nodesByGen.get(nextGen) || [];

    if (nextGenNodes.length === 0) continue;

    // Group children by their parent set
    const childrenByParentSet = new Map<string, string[]>();

    nextGenNodes.forEach(childId => {
      const parentIds = Array.from(parentsOf.get(childId) || []).filter(
        pId =>
          members[pId] && component.has(pId) && currentGenNodes.includes(pId)
      );

      if (parentIds.length === 0) return;

      const parentKey = parentIds.sort().join('-');

      if (!childrenByParentSet.has(parentKey)) {
        childrenByParentSet.set(parentKey, []);
      }
      childrenByParentSet.get(parentKey)!.push(childId);
    });

    // Create sibling groups with their metadata
    const siblingGroups: Array<{
      parentKey: string;
      children: string[];
      parentCenterX: number;
      childSpacing: number;
    }> = [];

    childrenByParentSet.forEach((children, parentKey) => {
      const parentIds = parentKey.split('-').filter(id => members[id]);

      if (parentIds.length === 0) return;

      // CRITICAL: Get parent positions AFTER Step 7 spouse adjustments
      const parentPositions = parentIds
        .map(id => positionMap.get(id))
        .filter(pos => pos !== undefined) as { x: number; y: number }[];

      if (parentPositions.length === 0) return;

      // Calculate fresh parent center using CURRENT positions
      const parentCenterX =
        parentPositions.reduce((sum, pos) => sum + pos.x, 0) /
        parentPositions.length;

      // Dynamic spacing tied to D3 nodeSize (280 base); compress for large groups to stay under parents
      let childSpacing = 280; // Match D3 horizontal nodeSize for compatibility
      if (children.length > 3) {
        childSpacing = Math.max(150, (280 * 3) / children.length);
      }

      siblingGroups.push({
        parentKey,
        children,
        parentCenterX,
        childSpacing,
      });
    });

    // Sort sibling groups by parent center X
    siblingGroups.sort((a, b) => a.parentCenterX - b.parentCenterX);

    // Position each sibling group centered under their parents
    const MIN_GROUP_GAP = 180; // Minimum gap between sibling groups

    siblingGroups.forEach((group, idx) => {
      const sortedChildren = [...group.children].sort((a, b) => {
        const posA = positionMap.get(a);
        const posB = positionMap.get(b);
        return (posA?.x || 0) - (posB?.x || 0);
      });

      const totalWidth = (sortedChildren.length - 1) * group.childSpacing;
      let centerX = group.parentCenterX;

      // Check for collision with previous group only
      if (idx > 0) {
        const prevGroup = siblingGroups[idx - 1]!;
        const prevChildren = prevGroup.children;

        // Get rightmost child of previous group from current positions
        const prevRightX = Math.max(
          ...prevChildren.map(id => positionMap.get(id)?.x || -Infinity)
        );

        const currLeftX = centerX - totalWidth / 2;
        const gap = currLeftX - prevRightX;

        // Only shift if there's actual overlap
        if (gap < MIN_GROUP_GAP) {
          centerX += (MIN_GROUP_GAP - gap);
        }
      }

      // Position children symmetrically around center
      const startX = centerX - totalWidth / 2;

      sortedChildren.forEach((childId, index) => {
        const childPos = positionMap.get(childId);
        if (childPos) {
          positionMap.set(childId, {
            x: startX + index * group.childSpacing,
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

      // Check if person is divorced
      const isDivorced = (member as any)?.isDivorced;

      return {
        id: memberId,
        type: 'familyMember',
        data: {
          ...member,
          label: member.name || 'Unknown',
          isDivorced, // Pass divorce status to node component
        },
        position: pos,
        style: {
          minWidth: '180px',
          border: isDivorced ? '2px dashed #9ca3af' : undefined, // Dashed border for divorced
          opacity: isDivorced ? 0.85 : 1,
        },
      };
    });

  const flowEdges: Edge[] = [];
  const processedChildEdges = new Set<string>();

  // Generate colors for polygamy cases
  const polygamyColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
  ];
  // Identify polygamy cases (people with multiple partners)
  const polygamyMap = new Map<string, string[]>(); // personId -> [partner1, partner2, ...]

  Object.entries(members).forEach(([memberId, member]) => {
    if (!component.has(memberId)) return;
    if (member.partners && member.partners.length > 1) {
      const validPartners = member.partners.filter(p => members[p] && component.has(p));
      if (validPartners.length > 1) {
        polygamyMap.set(memberId, validPartners);
      }
    }
  });
  // Create color map for parent pairs in polygamy situations
  const parentPairColors = new Map<string, string>();

  polygamyMap.forEach((partners, centerId) => {
    partners.forEach((partnerId, index) => {
      const pairKey = [centerId, partnerId].sort().join('-');
      parentPairColors.set(pairKey, polygamyColors[index % polygamyColors.length]!);
    });
  });

  // Parent-child edges with color coding
  parentsOf.forEach((parentIds, childId) => {
    if (!component.has(childId) || !members[childId]) return;
    const parents = Array.from(parentIds).filter(
      p => members[p] && component.has(p)
    );
    // Determine edge color based on parent pair
    let edgeColor = '#94a3b8'; // default gray

    if (parents.length === 2) {
      const pairKey = parents.sort().join('-');

      // Check if either parent is in a polygamy situation
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

        // Check if either person is divorced (from this specific partner)
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
            stroke: isDivorced ? '#9ca3af' : '#e879f9', // gray if divorced, pink if not
            strokeWidth: 2,
            strokeDasharray: isDivorced ? '10,5' : '5,5', // different dash pattern
            opacity: isDivorced ? 0.5 : 1, // faded if divorced
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