import type { Node, Edge } from 'reactflow';
import type { FamilyMember } from '@/types/familytree';

interface BackendFamilyResponse {
  data: {
    root: string;
    datalist: {
      key: string;
      value: FamilyMember;
    }[];
  };
}

interface LayoutNode {
  id: string;
  generation: number;
  x: number;
  y: number;
  width: number;
  children: string[];
}

export function mapFamilyDataToFlow(response: BackendFamilyResponse) {
  const members = Object.fromEntries(
    response.data.datalist.map(item => [item.key, item.value])
  );

  // Build family relationships map
  const memberMap = new Map<string, LayoutNode>();
  const parentOf = new Map<string, string[]>(); // parent -> [children]
  const partnersOf = new Map<string, string[]>(); // member -> [partners]

  // Initialize structure
  for (const memberId of Object.keys(members)) {
    memberMap.set(memberId, {
      id: memberId,
      generation: 0,
      x: 0,
      y: 0,
      width: 160,
      children: [],
    });
    parentOf.set(memberId, []);
    partnersOf.set(memberId, []);
  }

  // Build relationships
  for (const [memberId, member] of Object.entries(members)) {
    // Handle children relationships
    if (member.children && Array.isArray(member.children)) {
      for (const childGroup of member.children) {
        const childIds = childGroup.value || childGroup;
        if (Array.isArray(childIds)) {
          for (const childId of childIds) {
            if (parentOf.has(memberId)) {
              parentOf.get(memberId)!.push(childId);
            }
          }
        }
      }
    }

    // Handle partner relationships
    if (Array.isArray(member.partners)) {
      for (const partnerId of member.partners) {
        if (partnersOf.has(memberId)) {
          partnersOf.get(memberId)!.push(partnerId);
        }
      }
    }
  }

  // Calculate generations (BFS from root)
  const root = response.data.root;
  const generationQueue: [string, number][] = [[root, 0]];
  const visited = new Set<string>();

  while (generationQueue.length > 0) {
    const [memberId, gen] = generationQueue.shift()!;

    if (visited.has(memberId)) continue;
    visited.add(memberId);

    const node = memberMap.get(memberId);
    if (node) {
      node.generation = gen;

      // Process children (next generation down)
      const children = parentOf.get(memberId) || [];
      for (const childId of children) {
        generationQueue.push([childId, gen - 1]);
      }

      // Process partners (same generation)
      const partners = partnersOf.get(memberId) || [];
      for (const partnerId of partners) {
        generationQueue.push([partnerId, gen]);
      }
    }
  }

  // Group by generation
  const generationGroups = new Map<number, LayoutNode[]>();
  for (const node of memberMap.values()) {
    if (!generationGroups.has(node.generation)) {
      generationGroups.set(node.generation, []);
    }
    generationGroups.get(node.generation)!.push(node);
  }

  // Calculate layout positions
  const verticalSpacing = 200;
  const horizontalSpacing = 180;
  const generationIndices = new Map<number, number>();

  for (const [generation, nodes] of generationGroups) {
    const y = -generation * verticalSpacing; // Root at y=0, ancestors go up, descendants go down
    const totalWidth = nodes.length * horizontalSpacing;

    nodes.forEach((node, index) => {
      node.y = y;
      node.x = (index * horizontalSpacing) - totalWidth / 2;
    });
  }

  // Create React Flow nodes
  const flowNodes: Node[] = [];
  for (const [memberId, member] of Object.entries(members)) {
    const layoutNode = memberMap.get(memberId);
    if (!layoutNode) continue;

    const isPartner = partnersOf.get(memberId)?.length ?? 0 > 0;

    flowNodes.push({
      id: memberId,
      type: 'familyMember',
      data: {
        ...member,
        gender: member.gender,
        label: member.name || 'Unknown',
      },
      position: { x: layoutNode.x, y: layoutNode.y },
      style: {
        minWidth: '140px',
      },
    });
  }

  // Create React Flow edges
  const flowEdges: Edge[] = [];

  // Parent-child edges
  for (const [parentId, childIds] of parentOf) {
    for (const childId of childIds) {
      flowEdges.push({
        id: `parent-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        type: 'smoothstep',
        markerEnd: { type: 'arrowclosed' },
      });
    }
  }

  // Partner edges (horizontal connectors)
  for (const [memberId, partnerIds] of partnersOf) {
    for (const partnerId of partnerIds) {
      // Avoid duplicate edges
      const edgeId = `partner-${memberId}-${partnerId}`;
      const reverseId = `partner-${partnerId}-${memberId}`;

      if (
        !flowEdges.some(
          (e) =>
            e.id === edgeId ||
            e.id === reverseId ||
            e.id === `partner-${memberId}-${partnerId}`
        )
      ) {
        flowEdges.push({
          id: edgeId,
          source: memberId,
          target: partnerId,
          type: 'straight',
          markerEnd: { type: 'arrowclosed' },
          style: { stroke: '#ff69b4', strokeWidth: 2 },
        });
      }
    }
  }

  return { nodes: flowNodes, edges: flowEdges, members };
}