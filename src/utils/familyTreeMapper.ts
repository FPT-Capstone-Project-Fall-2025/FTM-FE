import { MarkerType, type Node, type Edge } from 'reactflow';
import type { FamilytreeDataResponse, FamilyMember } from '@/types/familytree';

interface ChildrenGroup {
  key: string; // partnerId
  value: string[]; // childIds
}

export function mapFamilyDataToFlow(response: FamilytreeDataResponse) {
  // Convert datalist to members map
  const members: Record<string, FamilyMember> = Object.fromEntries(
    response.datalist.map(item => [item.key, item.value])
  );

  // Build relationship maps
  const childrenOf = new Map<string, string[]>(); // parentId -> childIds
  const parentsOf = new Map<string, Set<string>>(); // childId -> parentIds
  const partnerPairs = new Set<string>(); // "parentA-parentB" pairs who have children together

  // Initialize maps
  Object.keys(members).forEach(memberId => {
    childrenOf.set(memberId, []);
    parentsOf.set(memberId, new Set());
  });

  // Process all members to build relationships
  Object.entries(members).forEach(([memberId, member]) => {
    // Process children array: each entry has a partner key and children values
    if (member.children && Array.isArray(member.children)) {
      member.children.forEach((childGroup: ChildrenGroup) => {
        const partnerId = childGroup.key;
        const childIds = childGroup.value || [];

        // Add children to this parent
        childIds.forEach(childId => {
          if (!childrenOf.get(memberId)!.includes(childId)) {
            childrenOf.get(memberId)!.push(childId);
          }
          parentsOf.get(childId)!.add(memberId);
          
          // Also add the partner as parent
          if (partnerId && members[partnerId]) {
            parentsOf.get(childId)!.add(partnerId);
            if (!childrenOf.get(partnerId)!.includes(childId)) {
              childrenOf.get(partnerId)!.push(childId);
            }
          }
        });

        // Track partner pairs who have children together
        if (partnerId && partnerId !== memberId && members[partnerId]) {
          const pair = [memberId, partnerId].sort().join('-');
          partnerPairs.add(pair);
        }
      });
    }
  });

  // Calculate generations using BFS from root
  const root = response.root;
  const generationMap = new Map<string, number>();
  const queue: Array<[string, number]> = [[root, 0]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [memberId, gen] = queue.shift()!;
    if (visited.has(memberId)) continue;
    visited.add(memberId);

    generationMap.set(memberId, gen);

    // Add children to queue (next generation down)
    const children = childrenOf.get(memberId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push([childId, gen - 1]);
      }
    });

    // Add partners to same generation
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

      // Try to assign based on children's generation
      const children = childrenOf.get(memberId) || [];
      for (const childId of children) {
        if (generationMap.has(childId)) {
          assignedGen = generationMap.get(childId)! + 1;
          break;
        }
      }

      // Try to assign based on partners' generation
      if (assignedGen === null && member?.partners) {
        for (const partnerId of member.partners) {
          if (generationMap.has(partnerId)) {
            assignedGen = generationMap.get(partnerId) || null;
            break;
          }
        }
      }

      // Default to root generation
      if (assignedGen === null) {
        assignedGen = 0;
      }

      generationMap.set(memberId, assignedGen);
    }
  });

  // Group members by generation
  const generationGroups = new Map<number, string[]>();
  generationMap.forEach((gen, memberId) => {
    if (!generationGroups.has(gen)) {
      generationGroups.set(gen, []);
    }
    generationGroups.get(gen)!.push(memberId);
  });

  // Sort generations (highest to lowest)
  const sortedGenerations = Array.from(generationGroups.keys()).sort((a, b) => b - a);

  // Layout configuration
  const verticalSpacing = 250;
  const horizontalSpacing = 200;
  const partnerSpacing = 120; // Closer spacing for partners
  const positionMap = new Map<string, { x: number; y: number }>();

  // Position nodes generation by generation
  sortedGenerations.forEach(generation => {
    const memberIds = generationGroups.get(generation)!;
    const y = -generation * verticalSpacing;

    // Group partners together
    const positioned = new Set<string>();
    const groups: string[][] = [];

    memberIds.forEach(memberId => {
      if (positioned.has(memberId)) return;

      const member = members[memberId];
      const group = [memberId];
      positioned.add(memberId);

      // Add partners to the same group
      if (member?.partners && Array.isArray(member.partners)) {
        member.partners.forEach(partnerId => {
          if (memberIds.includes(partnerId) && !positioned.has(partnerId)) {
            group.push(partnerId);
            positioned.add(partnerId);
          }
        });
      }

      groups.push(group);
    });

    // Calculate total width needed
    let totalWidth = 0;
    groups.forEach(group => {
      if (group.length === 1) {
        totalWidth += horizontalSpacing;
      } else {
        totalWidth += (group.length - 1) * partnerSpacing + horizontalSpacing;
      }
    });

    // Position groups
    let currentX = -totalWidth / 2;
    groups.forEach(group => {
      if (group.length === 1) {
        positionMap.set(group[0]!, { x: currentX + horizontalSpacing / 2, y });
        currentX += horizontalSpacing;
      } else {
        // Position partners close together
        group.forEach((memberId, index) => {
          positionMap.set(memberId, { 
            x: currentX + index * partnerSpacing, 
            y 
          });
        });
        currentX += (group.length - 1) * partnerSpacing + horizontalSpacing;
      }
    });
  });

  // Adjust children positions to center between parents
  parentsOf.forEach((parentIds, childId) => {
    const parents = Array.from(parentIds);
    if (parents.length === 2) {
      const parent1Pos = positionMap.get(parents[0]!);
      const parent2Pos = positionMap.get(parents[1]!);
      const childPos = positionMap.get(childId);

      if (parent1Pos && parent2Pos && childPos) {
        // Center child between parents
        childPos.x = (parent1Pos.x + parent2Pos.x) / 2;
      }
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
        minWidth: '160px',
      },
    };
  });

  // Create React Flow edges
  const flowEdges: Edge[] = [];

  // Parent-child edges (from parent to child)
  childrenOf.forEach((childIds, parentId) => {
    childIds.forEach(childId => {
      // Only create one edge per parent-child relationship
      const edgeId = `child-${parentId}-${childId}`;
      if (!flowEdges.some(e => e.id === edgeId)) {
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

  // Partner edges - create for ALL partners in the partners array
  const processedPartnerPairs = new Set<string>();
  
  Object.entries(members).forEach(([memberId, member]) => {
    if (member.partners && Array.isArray(member.partners)) {
      member.partners.forEach(partnerId => {
        // Create sorted pair to avoid duplicates
        const pair = [memberId, partnerId].sort().join('-');
        
        if (!processedPartnerPairs.has(pair) && members[partnerId]) {
          processedPartnerPairs.add(pair);
          
          // Check if they have children together
          const hasChildren = partnerPairs.has(pair);
          
          if (!hasChildren) {
            flowEdges.push({
              id: `partner-${pair}`,
              source: memberId,
              target: partnerId,
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