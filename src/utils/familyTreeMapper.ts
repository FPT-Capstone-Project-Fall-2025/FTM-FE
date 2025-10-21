import { MarkerType, type Node, type Edge } from 'reactflow';
import type { FamilytreeDataResponse } from '@/types/familytree';

interface ChildrenGroup {
  key: string;
  value: string[];
}

export function mapFamilyDataToFlow(response: FamilytreeDataResponse) {

  const members = Object.fromEntries(
    response.datalist.map(item => [item.key, item.value])
  );

  // Build relationship maps
  const childrenOf = new Map<string, string[]>(); // parent -> [children]
  const parentsOf = new Map<string, string[]>(); // child -> [parents]
  const coParentPairs = new Set<string>(); // "parentA-parentB" pairs (sorted)

  // Initialize maps
  for (const memberId of Object.keys(members)) {
    childrenOf.set(memberId, []);
    parentsOf.set(memberId, []);
  }

  // Build relationships from the JSON structure
  for (const [memberId, member] of Object.entries(members)) {
    // Handle children relationships
    if (member.children && Array.isArray(member.children)) {
      for (const childGroup of member.children) {
        const coParentId = (childGroup as ChildrenGroup).key;
        const childIds = (childGroup as ChildrenGroup).value || [];

        if (Array.isArray(childIds)) {
          for (const childId of childIds) {
            if (!childrenOf.get(memberId)!.includes(childId)) {
              childrenOf.get(memberId)!.push(childId);
            }
            if (!parentsOf.get(childId)!.includes(memberId)) {
              parentsOf.get(childId)!.push(memberId);
            }
          }

          // Track co-parent pairs for partner edges
          if (
            coParentId &&
            coParentId !== memberId &&
            members[coParentId]
          ) {
            const pair = [memberId, coParentId].sort().join('-');
            coParentPairs.add(pair);
          }
        }
      }
    }
  }

  // Calculate generations via BFS
  const root = response.root;
  const generationMap = new Map<string, number>();
  const queue: Array<[string, number]> = [[root, 0]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [memberId, gen] = queue.shift()!;

    if (visited.has(memberId)) continue;
    visited.add(memberId);

    generationMap.set(memberId, gen);

    // Process children (next generation down)
    const children = childrenOf.get(memberId) || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        queue.push([childId, gen - 1]);
      }
    }
  }

  // Ensure all members are assigned a generation (including partners without direct links)
  for (const memberId of Object.keys(members)) {
    if (!generationMap.has(memberId)) {
      const member = members[memberId];
      let assignedGen: number | null = null;

      // Check if they have children
      if (member?.children && Array.isArray(member.children)) {
        for (const childGroup of member.children) {
          const childIds = (childGroup as ChildrenGroup).value || [];
          for (const childId of childIds) {
            if (generationMap.has(childId)) {
              assignedGen = generationMap.get(childId)! + 1;
              break;
            }
          }
          if (assignedGen !== null) break;
        }
      }

      // Check if they have partners
      if (
        assignedGen === null &&
        member?.partners &&
        Array.isArray(member.partners)
      ) {
        for (const partnerId of member.partners) {
          if (generationMap.has(partnerId)) {
            assignedGen = generationMap.get(partnerId)!;
            break;
          }
        }
      }

      // Default to root generation if still unassigned
      if (assignedGen === null) {
        assignedGen = 0;
      }

      generationMap.set(memberId, assignedGen);
    }
  }

  // Group by generation
  const generationGroups = new Map<number, string[]>();
  for (const [memberId, gen] of generationMap) {
    if (!generationGroups.has(gen)) {
      generationGroups.set(gen, []);
    }
    generationGroups.get(gen)!.push(memberId);
  }

  // Layout calculation with parent centering
  const verticalSpacing = 200;
  const horizontalSpacing = 220;
  const positionMap = new Map<string, { x: number; y: number }>();

  // First pass: position by generation
  for (const [generation, memberIds] of generationGroups) {
    const y = -generation * verticalSpacing;
    const totalWidth = memberIds.length * horizontalSpacing;

    memberIds.forEach((memberId, index) => {
      const x = index * horizontalSpacing - totalWidth / 2;
      positionMap.set(memberId, { x, y });
    });
  }

  // Second pass: adjust children to center between parents
  for (const [childId, parentIds] of parentsOf) {
    if (parentIds.length === 2) {
      const parent1Pos = positionMap.get(parentIds[0]!);
      const parent2Pos = positionMap.get(parentIds[1]!);

      if (parent1Pos && parent2Pos) {
        const childPos = positionMap.get(childId);
        if (childPos) {
          // Center child between two parents
          childPos.x = (parent1Pos.x + parent2Pos.x) / 2;
        }
      }
    }
  }

  // Create React Flow nodes
  const flowNodes: Node[] = [];
  for (const [memberId, member] of Object.entries(members)) {
    const pos = positionMap.get(memberId);
    if (!pos) continue;

    flowNodes.push({
      id: memberId,
      type: 'familyMember',
      data: {
        id: member.id,
        name: member.name,
        birthDate: member.birthDate,
        gender: member.gender,
        avatar: member.avatar,
        bio: member.bio,
        images: member.images,
        gpMemberFiles: member.gpMemberFiles,
        partners: member.partners,
        children: member.children,
        label: member.name || 'Unknown',
      },
      position: pos,
      style: {
        minWidth: '140px',
      },
    });
  }

  // Create React Flow edges
  const flowEdges: Edge[] = [];

  // Parent-child edges
  for (const [parentId, childIds] of childrenOf) {
    for (const childId of childIds) {
      flowEdges.push({
        id: `child-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    }
  }

  // Partner edges only for actual co-parents
  for (const pair of coParentPairs) {
    const [parentA, parentB] = pair.split('-');

    flowEdges.push({
      id: `partner-${pair}`,
      source: parentA!,
      target: parentB!,
      type: 'straight',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#ff69b4', strokeWidth: 2 },
    });
  }

  return { nodes: flowNodes, edges: flowEdges, members };
}