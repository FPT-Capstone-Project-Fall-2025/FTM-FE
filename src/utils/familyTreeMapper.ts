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
  x?: number;
  y?: number;
}

export function mapFamilyDataToFlow(response: FamilytreeDataResponse) {
  // Convert datalist to members map
  const members: Record<string, FamilyMember> = Object.fromEntries(
    response.datalist.map(item => [item.key, item.value])
  );

  // Build relationship maps
  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, Set<string>>();
  const partnerPairs = new Set<string>();

  // Initialize maps
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

  // Calculate generations using BFS
  const root = response.root;
  const generationMap = new Map<string, number>();
  const queue: Array<[string, number]> = [[root, 0]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [memberId, gen] = queue.shift()!;
    if (visited.has(memberId)) continue;
    visited.add(memberId);

    generationMap.set(memberId, gen);

    const children = childrenOf.get(memberId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push([childId, gen + 1]);
      }
    });

    const member = members[memberId];
    if (member?.partners && Array.isArray(member.partners)) {
      member.partners.forEach(partnerId => {
        if (!visited.has(partnerId) && members[partnerId]) {
          queue.push([partnerId, gen]);
        }
      });
    }
  }

  // Ensure all members have a generation
  Object.keys(members).forEach(memberId => {
    if (!generationMap.has(memberId)) {
      const member = members[memberId];
      let assignedGen: number | null = null;

      const children = childrenOf.get(memberId) || [];
      for (const childId of children) {
        if (generationMap.has(childId)) {
          assignedGen = generationMap.get(childId)! - 1;
          break;
        }
      }

      if (assignedGen === null && member?.partners) {
        for (const partnerId of member.partners) {
          if (generationMap.has(partnerId)) {
            assignedGen = generationMap.get(partnerId) || null;
            break;
          }
        }
      }

      if (assignedGen === null) {
        assignedGen = 0;
      }

      generationMap.set(memberId, assignedGen);
    }
  });

  // === D3.js TREE LAYOUT ===
  // Build D3 tree hierarchy
  function buildD3Tree(nodeId: string, visited: Set<string>): D3TreeNode {
    if (visited.has(nodeId)) {
      return { id: nodeId };
    }
    visited.add(nodeId);

    const children = childrenOf.get(nodeId) || [];
    const node: D3TreeNode = { id: nodeId };

    if (children.length > 0) {
      node.children = children.map(childId => buildD3Tree(childId, visited));
    }

    return node;
  }

  const d3Root = buildD3Tree(root, new Set());

  // Create D3 tree layout
  const treeLayout = d3.tree<D3TreeNode>()
    .nodeSize([300, 350]) // [horizontal spacing, vertical spacing]
    .separation((a, b) => {
      // More separation for nodes with many descendants
      return a.parent === b.parent ? 1 : 1.2;
    });

  // Convert to hierarchy and calculate layout
  const hierarchy = d3.hierarchy(d3Root);
  const treeData = treeLayout(hierarchy);

  // Extract positions from D3 layout
  const positionMap = new Map<string, { x: number; y: number }>();
  
  treeData.descendants().forEach(node => {
    positionMap.set(node.data.id, {
      x: node.x,
      y: node.y
    });
  });

  // Position partners next to their spouses
  Object.entries(members).forEach(([memberId, member]) => {
    if (member.partners && Array.isArray(member.partners)) {
      const memberPos = positionMap.get(memberId);
      if (memberPos) {
        member.partners.forEach((partnerId, index) => {
          if (members[partnerId] && !positionMap.has(partnerId)) {
            // Position partner to the right of the member
            positionMap.set(partnerId, {
              x: memberPos.x + (index + 1) * 200,
              y: memberPos.y
            });
          } else if (members[partnerId] && positionMap.has(partnerId)) {
            // Partner already positioned, adjust to be closer
            const partnerPos = positionMap.get(partnerId)!;
            const avgX = (memberPos.x + partnerPos.x) / 2;
            
            positionMap.set(memberId, {
              x: avgX - 100,
              y: memberPos.y
            });
            positionMap.set(partnerId, {
              x: avgX + 100,
              y: partnerPos.y
            });
          }
        });
      }
    }
  });

  // Adjust positions for partners who share children
  partnerPairs.forEach(pairKey => {
    const [partner1, partner2] = pairKey.split('-');
    const pos1 = positionMap.get(partner1!);
    const pos2 = positionMap.get(partner2!);
    
    if (pos1 && pos2) {
      // Ensure they're on the same Y level
      const avgY = (pos1.y + pos2.y) / 2;
      const centerX = (pos1.x + pos2.x) / 2;
      
      positionMap.set(partner1!, {
        x: centerX - 100,
        y: avgY
      });
      positionMap.set(partner2!, {
        x: centerX + 100,
        y: avgY
      });
      
      // Position their children centered under them
      const children = childrenOf.get(partner1!) || [];
      children.forEach(childId => {
        const childPos = positionMap.get(childId);
        if (childPos) {
          positionMap.set(childId, {
            x: childPos.x,
            y: avgY + 300
          });
        }
      });
    }

    // Separate children with/without children for better organization
    const childrenWithKids: string[] = [];
    const childrenWithoutKids: string[] = [];
    
    childIds.forEach(childId => {
      const hasChildren = (childrenOf.get(childId) || []).length > 0;
      if (hasChildren) {
        childrenWithKids.push(childId);
      } else {
        childrenWithoutKids.push(childId);
      }
    });

    // Arrange: childless on left, with children on right
    const orderedChildren = [...childrenWithoutKids, ...childrenWithKids];
    const numChildren = orderedChildren.length;
    const childSpacing = 240; // Increased spacing to prevent overlap
    const totalChildWidth = (numChildren - 1) * childSpacing;
    const startX = centerX - totalChildWidth / 2;

    orderedChildren.forEach((childId, index) => {
      const childPos = positionMap.get(childId);
      if (childPos) {
        childPos.x = startX + index * childSpacing;
      }
    });
  });

  // === END D3 LAYOUT ===

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
    const parents = Array.from(parentIds).filter(p => members[p]);
    
    if (parents.length === 0) return;
    
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
    if (member.partners && Array.isArray(member.partners)) {
      member.partners.forEach(partnerId => {
        const pair = [memberId, partnerId].sort().join('-');
        
        if (!processedPartnerPairs.has(pair) && members[partnerId]) {
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
    }
  });

  return { 
    nodes: flowNodes, 
    edges: flowEdges, 
    members 
  };
}