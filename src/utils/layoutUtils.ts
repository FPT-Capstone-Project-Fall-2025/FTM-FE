import type { Node, Edge } from 'reactflow';
import { mapFamilyDataToFlow } from './familyTreeMapper';
import type { FamilytreeDataResponse } from '@/types/familytree';

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

export interface LayoutOptions {
  direction?: LayoutDirection;
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

/**
 * Re-calculates the original D3 layout by re-running the mapper
 * This requires the original data response
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  originalData?: FamilytreeDataResponse
) {
  // If we don't have original data, we can't restore layout
  // Just return current nodes
  if (!originalData) {
    console.warn('Cannot restore layout: original data not available');
    return { nodes, edges };
  }

  try {
    // Re-run the mapper to get fresh D3 positions
    const { nodes: freshNodes, edges: freshEdges } = mapFamilyDataToFlow(
      originalData,
    );

    // Return the freshly calculated layout
    return { 
      nodes: freshNodes, 
      edges: freshEdges 
    };
  } catch (error) {
    console.error('Failed to restore layout:', error);
    return { nodes, edges };
  }
}