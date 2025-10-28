import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
) {
  const {
    direction = 'TB',
    nodeWidth = 180,
    nodeHeight = 100,
    rankSep = 200,
    nodeSep = 150,
  } = options;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure dagre layout
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
    edgesep: 80,
    ranker: 'network-simplex',
    align: 'UL', // Align upper left for better consistency
  });

  // Identify partner relationships and parent-child relationships
  const partnerEdges = new Set<string>();
  const childEdges = new Set<string>();
  const partnersOf = new Map<string, Set<string>>();
  const childrenOf = new Map<string, Set<string>>();
  const parentsOf = new Map<string, Set<string>>();

  edges.forEach(edge => {
    if (edge.id.startsWith('partner-')) {
      partnerEdges.add(edge.id);

      // Track partners
      if (!partnersOf.has(edge.source)) partnersOf.set(edge.source, new Set());
      if (!partnersOf.has(edge.target)) partnersOf.set(edge.target, new Set());
      partnersOf.get(edge.source)!.add(edge.target);
      partnersOf.get(edge.target)!.add(edge.source);
    } else if (edge.id.startsWith('child-')) {
      childEdges.add(edge.id);

      // Track children and parents
      if (!childrenOf.has(edge.source)) childrenOf.set(edge.source, new Set());
      if (!parentsOf.has(edge.target)) parentsOf.set(edge.target, new Set());
      childrenOf.get(edge.source)!.add(edge.target);
      parentsOf.get(edge.target)!.add(edge.source);
    }
  });

  // Add nodes to dagre
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  // Add edges to dagre (only parent-child for hierarchy)
  edges.forEach(edge => {
    if (childEdges.has(edge.id)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  // Run dagre layout
  dagre.layout(dagreGraph);

  // Apply layout to nodes
  const layoutedNodes = nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  // Post-process: Adjust partner positions to be closer
  const processedPartners = new Set<string>();
  const partnerSpacing = 200; // Horizontal spacing between partners

  layoutedNodes.forEach(node => {
    if (processedPartners.has(node.id)) return;

    const partners = partnersOf.get(node.id);
    if (!partners || partners.size === 0) return;

    // Group this node with its partners
    const partnerGroup = [node.id, ...Array.from(partners)];

    // Mark all as processed
    partnerGroup.forEach(id => processedPartners.add(id));

    // Calculate average position
    const positions = partnerGroup.map(id => {
      const n = layoutedNodes.find(n => n.id === id);
      return n?.position || { x: 0, y: 0 };
    });

    const avgX =
      positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
    const avgY =
      positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;

    // Reposition partners close together
    const isVertical = direction === 'TB' || direction === 'BT';
    const totalWidth = (partnerGroup.length - 1) * partnerSpacing;
    const startOffset = -totalWidth / 2;

    partnerGroup.forEach((partnerId, index) => {
      const partnerNode = layoutedNodes.find(n => n.id === partnerId);
      if (partnerNode) {
        if (isVertical) {
          // Arrange horizontally
          partnerNode.position.x = avgX + startOffset + index * partnerSpacing;
          partnerNode.position.y = avgY;
        } else {
          // Arrange vertically for LR/RL layouts
          partnerNode.position.x = avgX;
          partnerNode.position.y = avgY + startOffset + index * partnerSpacing;
        }
      }
    });
  });

  // Post-process: Organize children - childless on one side, parents on other
  const processedChildren = new Set<string>();

  parentsOf.forEach((parents, childId) => {
    if (processedChildren.has(childId)) return;

    const parentIds = Array.from(parents);
    if (parentIds.length === 0) return;

    // Find all siblings (children of same parents)
    const siblings: string[] = [];
    parentsOf.forEach((pSet, cId) => {
      const pIds = Array.from(pSet).sort();
      if (pIds.join('-') === parentIds.sort().join('-')) {
        siblings.push(cId);
        processedChildren.add(cId);
      }
    });

    if (siblings.length <= 1) return;

    // Separate siblings with/without children
    const siblingsWithChildren: string[] = [];
    const siblingsWithoutChildren: string[] = [];

    siblings.forEach(siblingId => {
      const hasChildren =
        childrenOf.has(siblingId) && childrenOf.get(siblingId)!.size > 0;
      if (hasChildren) {
        siblingsWithChildren.push(siblingId);
      } else {
        siblingsWithoutChildren.push(siblingId);
      }
    });

    // Order: childless first, then with children
    const orderedSiblings = [
      ...siblingsWithoutChildren,
      ...siblingsWithChildren,
    ];

    // Calculate center position
    const siblingPositions = siblings.map(id => {
      const n = layoutedNodes.find(n => n.id === id);
      return n?.position || { x: 0, y: 0 };
    });

    const isVertical = direction === 'TB' || direction === 'BT';
    const siblingSpacing = 240;

    if (isVertical) {
      // Arrange horizontally
      const avgX =
        siblingPositions.reduce((sum, pos) => sum + pos.x, 0) /
        siblingPositions.length;
      const avgY =
        siblingPositions.reduce((sum, pos) => sum + pos.y, 0) /
        siblingPositions.length;
      const totalWidth = (orderedSiblings.length - 1) * siblingSpacing;
      const startX = avgX - totalWidth / 2;

      orderedSiblings.forEach((siblingId, index) => {
        const siblingNode = layoutedNodes.find(n => n.id === siblingId);
        if (siblingNode) {
          siblingNode.position.x = startX + index * siblingSpacing;
          siblingNode.position.y = avgY;
        }
      });
    } else {
      // Arrange vertically for LR/RL
      const avgX =
        siblingPositions.reduce((sum, pos) => sum + pos.x, 0) /
        siblingPositions.length;
      const avgY =
        siblingPositions.reduce((sum, pos) => sum + pos.y, 0) /
        siblingPositions.length;
      const totalHeight = (orderedSiblings.length - 1) * siblingSpacing;
      const startY = avgY - totalHeight / 2;

      orderedSiblings.forEach((siblingId, index) => {
        const siblingNode = layoutedNodes.find(n => n.id === siblingId);
        if (siblingNode) {
          siblingNode.position.x = avgX;
          siblingNode.position.y = startY + index * siblingSpacing;
        }
      });
    }
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
}
