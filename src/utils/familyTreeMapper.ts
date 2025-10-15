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

export function mapFamilyDataToFlow(response: BackendFamilyResponse) {
  
  const members = Object.fromEntries(
    response.data.datalist.map(item => [item.key, item.value])
  );

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Simple layout positioning (you can replace with your own layout logic)
  let x = 0;
  let y = 0;
  const stepX = 300;
  const stepY = 200;

  for (const member of Object.values(members)) {
    nodes.push({
      id: member.id,
      type: 'familyMember',
      data: {
        ...member,
        gender: member.gender,
        label: member.name || 'Unknown',
      },
      position: { x, y },
    });
    x += stepX;
    if (x > 1000) {
      x = 0;
      y += stepY;
    }
  }

  // Generate edges for parent-child relationships
  for (const member of Object.values(members)) {
    if (member.children && Array.isArray(member.children)) {
      for (const childGroup of member.children) {
        const childIds = childGroup.value;
        for (const childId of childIds) {
          if (members[childId]) {
            edges.push({
              id: `${member.id}-${childId}`,
              source: member.id,
              target: childId,
              type: 'smoothstep',
            });
          }
        }
      }
    }
  }

  // Generate edges between partners (optional)
  for (const member of Object.values(members)) {
    if (Array.isArray(member.partners)) {
      for (const partnerId of member.partners) {
        if (members[partnerId]) {
          const edgeId = `partner-${member.id}-${partnerId}`;
          if (
            !edges.some(
              e =>
                e.id === edgeId || e.id === `partner-${partnerId}-${member.id}`
            )
          ) {
            edges.push({
              id: edgeId,
              source: member.id,
              target: partnerId,
              type: 'straight',
            });
          }
        }
      }
    }
  }

  return { nodes, edges, members };
}
