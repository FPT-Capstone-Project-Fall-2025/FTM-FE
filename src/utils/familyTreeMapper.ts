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

export function mapFamilyDataToFlow(response: FamilytreeDataResponse) {
  // Convert datalist to members map
  const members: Record<string, FamilyMember> = Object.fromEntries(
    response.datalist.map(item => [item.key, item.value])
  );

  // Validate we have members
  if (Object.keys(members).length === 0) {
    return { nodes: [], edges: [], members: {} };
  }

  // Build relationship maps with validation
  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, Set<string>>();
  const partnerPairs = new Set<string>();

  // Initialize maps only for existing members
  Object.keys(members).forEach(memberId => {
    childrenOf.set(memberId, []);
    parentsOf.set(memberId, new Set());
  });

  // Process all members to build relationships
  Object.entries(members).forEach(([memberId, member]) => {
    if (member.children && Array.isArray(member.children)) {
      member.children.forEach((childGroup: ChildrenGroup) => {
        const partnerId = childGroup.key;
        const childIds = childGroup.value || [];

        childIds.forEach(childId => {
          // CRITICAL: Only process if child still exists
          if (!members[childId]) return;
          
          if (!childrenOf.get(memberId)!.includes(childId)) {
            childrenOf.get(memberId)!.push(childId);
          }
          parentsOf.get(childId)!.add(memberId);
          
          // CRITICAL: Only add partner if they exist
          if (partnerId && members[partnerId]) {
            parentsOf.get(childId)!.add(partnerId);
            if (!childrenOf.get(partnerId)!.includes(childId)) {
              childrenOf.get(partnerId)!.push(childId);
            }
          }
        });

        // Track partner pairs only if both exist
        if (partnerId && partnerId !== memberId && members[partnerId]) {
          const pair = [memberId, partnerId].sort().join('-');
          partnerPairs.add(pair);
        }
      });
    }
  });

  // Validate root exists, fallback if not
  const root = members[response.root] ? response.root : Object.keys(members)[0];
  if (!root) {
    return { nodes: [], edges: [], members: {} };
  }

  // Calculate generations using BFS
  const generationMap = new Map<string, number>();
  const queue: Array<[string, number]> = [[root, 0]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [memberId, gen] = queue.shift()!;
    if (visited.has(memberId) || !members[memberId]) continue;
    visited.add(memberId);

    generationMap.set(memberId, gen);

    // Add children (only if they exist)
    const children = (childrenOf.get(memberId) || []).filter(cId => members[cId]);
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push([childId, gen + 1]);
      }
    });

    // Add partners to same generation (only if they exist)
    const member = members[memberId];
    if (member?.partners && Array.isArray(member.partners)) {
      member.partners.forEach(partnerId => {
        if (!visited.has(partnerId) && members[partnerId]) {
          queue.push([partnerId, gen]);
        }
      });
    }
  }

  // Ensure all remaining members have a generation
  Object.keys(members).forEach(memberId => {
    if (!generationMap.has(memberId)) {
      const member = members[memberId];
      let assignedGen: number | null = null;

      // Try children
      const children = (childrenOf.get(memberId) || []).filter(cId => members[cId]);
      for (const childId of children) {
        if (generationMap.has(childId)) {
          assignedGen = generationMap.get(childId)! - 1;
          break;
        }
      }

      // Try partners
      if (assignedGen === null && member?.partners) {
        for (const partnerId of member.partners) {
          if (generationMap.has(partnerId) && members[partnerId]) {
            assignedGen = generationMap.get(partnerId) || null;
            break;
          }
        }
      }

      generationMap.set(memberId, assignedGen ?? 0);
    }
  });

  // === D3.js TREE LAYOUT WITH FIXED MULTI-PARENT SUPPORT ===
  
  // Step 1: Build D3 tree (following primary parent line only)
  function buildD3Tree(nodeId: string, visited: Set<string>): D3TreeNode | null {
    if (!members[nodeId] || visited.has(nodeId)) {
      return null;
    }
    visited.add(nodeId);

    const node: D3TreeNode = { id: nodeId };
    const children = (childrenOf.get(nodeId) || []).filter(cId => members[cId]);

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

  const d3RootNode = buildD3Tree(root, new Set());
  
  if (!d3RootNode) {
    return { nodes: [], edges: [], members: {} };
  }

  // Step 2: Apply D3 tree layout
  const treeLayout = d3.tree<D3TreeNode>()
    .nodeSize([280, 320]) // [horizontal, vertical] spacing
    .separation((a, b) => {
      // Same parent = closer, different parent = further
      return a.parent === b.parent ? 1 : 1.5;
    });

  const hierarchy = d3.hierarchy(d3RootNode);
  const treeData = treeLayout(hierarchy);

  // Step 3: Extract initial positions from D3
  const positionMap = new Map<string, { x: number; y: number }>();
  
  treeData.descendants().forEach(node => {
    positionMap.set(node.data.id, {
      x: node.x,
      y: node.y
    });
  });

  // Step 4: Position partners adjacent to their spouses
  const partnersProcessed = new Set<string>();
  
  Object.entries(members).forEach(([memberId, member]) => {
    if (!member.partners || !Array.isArray(member.partners)) return;
    
    const memberPos = positionMap.get(memberId);
    if (!memberPos) return;

    const validPartners = member.partners.filter(pId => members[pId]);
    
    validPartners.forEach((partnerId) => {
      const pairKey = [memberId, partnerId].sort().join('-');
      if (partnersProcessed.has(pairKey)) return;
      partnersProcessed.add(pairKey);

      const partnerPos = positionMap.get(partnerId);
      
      if (!partnerPos) {
        // Partner not in D3 tree, position next to spouse
        positionMap.set(partnerId, {
          x: memberPos.x + 200,
          y: memberPos.y
        });
      } else {
        // Both in tree, center them together
        const centerX = (memberPos.x + partnerPos.x) / 2;
        const avgY = (memberPos.y + partnerPos.y) / 2;
        
        positionMap.set(memberId, {
          x: centerX - 100,
          y: avgY
        });
        positionMap.set(partnerId, {
          x: centerX + 100,
          y: avgY
        });
      }
    });
  });

  // Step 5: Adjust children to be centered between both parents
  parentsOf.forEach((parentIds, childId) => {
    if (!members[childId]) return;
    
    const parents = Array.from(parentIds).filter(pId => members[pId]);
    if (parents.length !== 2) return; // Only adjust for two-parent children
    
    const parent1Pos = positionMap.get(parents[0]!);
    const parent2Pos = positionMap.get(parents[1]!);
    const childPos = positionMap.get(childId);
    
    if (!parent1Pos || !parent2Pos || !childPos) return;
    
    // Center child between both parents (X axis only, keep D3's Y)
    const parentCenterX = (parent1Pos.x + parent2Pos.x) / 2;
    
    // Group siblings from same parents
    const siblings = Array.from(parentsOf.entries())
      .filter(([_, pIds]) => {
        const pArray = Array.from(pIds).sort();
        return pArray.length === 2 && pArray[0] === parents[0] && pArray[1] === parents[1];
      })
      .map(([sibId, _]) => sibId)
      .filter(sibId => members[sibId]);
    
    // Calculate total width needed for all siblings
    const siblingSpacing = 250;
    const totalWidth = (siblings.length - 1) * siblingSpacing;
    const startX = parentCenterX - totalWidth / 2;
    
    // Redistribute siblings evenly
    siblings.forEach((siblingId, index) => {
      const sibPos = positionMap.get(siblingId);
      if (sibPos) {
        positionMap.set(siblingId, {
          x: startX + index * siblingSpacing,
          y: sibPos.y // Keep D3's Y coordinate
        });
      }
    });
  });

  // Step 6: Handle any members not yet positioned (edge case)
  Object.keys(members).forEach(memberId => {
    if (!positionMap.has(memberId)) {
      const gen = generationMap.get(memberId) || 0;
      positionMap.set(memberId, {
        x: 0,
        y: gen * 320
      });
    }
  });

  // Create React Flow nodes
  const flowNodes: Node[] = Object.entries(members).map(([memberId, member]) => {
    const pos = positionMap.get(memberId) || { x: 0, y: 0 };

    return {
      id: memberId,
      type: 'familyMember',
      data: {
        ...member,
        label: member.name || 'Unknown',
      },
      position: pos,
      style: {
        minWidth: '180px',
      },
    };
  });

  // Create React Flow edges
  const flowEdges: Edge[] = [];

  // Parent-child edges
  const processedChildEdges = new Set<string>();
  
  parentsOf.forEach((parentIds, childId) => {
    if (!members[childId]) return;
    
    const parents = Array.from(parentIds).filter(p => members[p]);
    
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
            stroke: '#94a3b8',
            strokeWidth: 2,
          },
          markerEnd: { 
            type: MarkerType.ArrowClosed,
            color: '#94a3b8',
          },
        });
      }
    });
  });

  // Partner edges
  const processedPartnerPairs = new Set<string>();
  
  Object.entries(members).forEach(([memberId, member]) => {
    if (!member.partners || !Array.isArray(member.partners)) return;
    
    member.partners.forEach(partnerId => {
      if (!members[partnerId]) return;
      
      const pair = [memberId, partnerId].sort().join('-');
      
      if (!processedPartnerPairs.has(pair)) {
        processedPartnerPairs.add(pair);
        
        flowEdges.push({  
          id: `partner-${pair}`,
          source: memberId,
          target: partnerId,
          type: 'straight',
          animated: false,
          style: {
            stroke: '#e879f9',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
        });
      }
    });
  });

  return { 
    nodes: flowNodes, 
    edges: flowEdges, 
    members 
  };
}