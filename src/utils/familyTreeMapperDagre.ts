import { MarkerType, type Node, type Edge } from 'reactflow';
import type { FamilytreeDataResponse, FamilyMember } from '@/types/familytree';

interface ChildrenGroup {
    key: string;
    value: string[];
}

interface LayoutNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    level: number;
    partnerId?: string | undefined;
}

export function mapFamilyDataToFlowDagre(response: FamilytreeDataResponse) {
    const members: Record<string, FamilyMember> = Object.fromEntries(
        response.datalist.map(item => [item.key, item.value])
    );

    if (Object.keys(members).length === 0) {
        return { nodes: [], edges: [], members: {} };
    }

    const childrenOf = new Map<string, string[]>();
    const parentsOf = new Map<string, Set<string>>();
    const childToPartnerMap = new Map<string, { parent: string; partner: string }>();

    Object.keys(members).forEach(memberId => {
        childrenOf.set(memberId, []);
        parentsOf.set(memberId, new Set());
    });

    // Parse family relationships
    Object.entries(members).forEach(([memberId, member]) => {
        if (member.children && Array.isArray(member.children)) {
            member.children.forEach((childGroup: ChildrenGroup) => {
                const partnerId = childGroup.key;
                const childIds = childGroup.value || [];

                childIds.forEach(childId => {
                    if (!members[childId]) return;

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
            });
        }
    });

    const root = members[response.root] ? response.root : Object.keys(members)[0];
    if (!root) {
        return { nodes: [], edges: [], members: {} };
    }

    // Get connected component
    const component = new Set<string>();
    const stack: string[] = [root];
    while (stack.length > 0) {
        const id = stack.pop()!;
        if (component.has(id)) continue;
        component.add(id);

        parentsOf.get(id)?.forEach(p => {
            if (members[p]) stack.push(p);
        });
        childrenOf.get(id)?.forEach(c => {
            if (members[c]) stack.push(c);
        });
        members[id]?.partners?.forEach(p => {
            if (members[p]) stack.push(p);
        });
    }

    // Identify partner pairs
    const partnerPairs = new Map<string, string>();
    const processedPairs = new Set<string>();

    Object.entries(members).forEach(([memberId, member]) => {
        if (!component.has(memberId)) return;
        if (!member.partners || !Array.isArray(member.partners)) return;

        member.partners.forEach(partnerId => {
            if (!members[partnerId] || !component.has(partnerId)) return;
            const pairKey = [memberId, partnerId].sort().join('-');

            if (!processedPairs.has(pairKey)) {
                processedPairs.add(pairKey);
                partnerPairs.set(memberId, partnerId);
                partnerPairs.set(partnerId, memberId);
            }
        });
    });

    // Identify polygamy situations for color coding
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

    const polygamyColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const parentPairColors = new Map<string, string>();
    polygamyMap.forEach((partners, centerId) => {
        partners.forEach((partnerId, index) => {
            const pairKey = [centerId, partnerId].sort().join('-');
            parentPairColors.set(pairKey, polygamyColors[index % polygamyColors.length]!);
        });
    });

    // ========== IMPROVED FAMILY TREE LAYOUT ==========
    const NODE_WIDTH = 180;
    const NODE_HEIGHT = 100;
    const HORIZONTAL_SPACING = 60;
    const VERTICAL_SPACING = 120;
    const PARTNER_SPACING = 20;

    const layoutNodes = new Map<string, LayoutNode>();
    const levels = new Map<number, string[]>();

    // Assign levels using BFS from root
    function assignLevels(startId: string) {
        const queue: Array<{ id: string; level: number }> = [{ id: startId, level: 0 }];
        const levelAssignments = new Map<string, number>();

        while (queue.length > 0) {
            const { id, level } = queue.shift()!;

            if (levelAssignments.has(id)) {
                levelAssignments.set(id, Math.min(levelAssignments.get(id)!, level));
                continue;
            }

            levelAssignments.set(id, level);

            const children = childrenOf.get(id) || [];
            children.forEach(childId => {
                if (component.has(childId)) {
                    queue.push({ id: childId, level: level + 1 });
                }
            });

            const partnerId = partnerPairs.get(id);
            if (partnerId && !levelAssignments.has(partnerId)) {
                queue.push({ id: partnerId, level });
            }
        }

        return levelAssignments;
    }

    const levelAssignments = assignLevels(root);

    // Group by levels
    levelAssignments.forEach((level, id) => {
        if (!levels.has(level)) {
            levels.set(level, []);
        }
        levels.get(level)!.push(id);
    });

    const sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);

    // Calculate subtree width for each node (bottom-up)
    const subtreeWidth = new Map<string, number>();

    function calculateSubtreeWidth(nodeId: string): number {
        if (subtreeWidth.has(nodeId)) {
            return subtreeWidth.get(nodeId)!;
        }

        const partnerId = partnerPairs.get(nodeId);
        const children = childrenOf.get(nodeId)?.filter(childId => {
            if (!component.has(childId)) return false;
            if (partnerId) {
                return parentsOf.get(childId)?.has(partnerId);
            }
            return true;
        }) || [];

        if (children.length === 0) {
            // Leaf node or couple
            const width = partnerId ? (2 * NODE_WIDTH + PARTNER_SPACING) : NODE_WIDTH;
            subtreeWidth.set(nodeId, width);
            if (partnerId) subtreeWidth.set(partnerId, width);
            return width;
        }

        // Calculate total width needed for all children
        const childrenWidths = children.map(childId => calculateSubtreeWidth(childId));
        const totalChildrenWidth = childrenWidths.reduce((sum, w) => sum + w, 0);
        const totalChildrenSpacing = (children.length - 1) * HORIZONTAL_SPACING;
        const childrenRequiredWidth = totalChildrenWidth + totalChildrenSpacing;

        // Parent/couple width
        const parentWidth = partnerId ? (2 * NODE_WIDTH + PARTNER_SPACING) : NODE_WIDTH;

        // Subtree width is the max of parent width and children width
        const width = Math.max(parentWidth, childrenRequiredWidth);
        subtreeWidth.set(nodeId, width);
        if (partnerId) subtreeWidth.set(partnerId, width);

        return width;
    }

    // Calculate widths for all nodes (starting from leaves)
    sortedLevels.slice().reverse().forEach(level => {
        levels.get(level)!.forEach(nodeId => {
            calculateSubtreeWidth(nodeId);
        });
    });

    // Position nodes level by level (top-down)
    function positionSubtree(nodeId: string, centerX: number, level: number) {
        if (layoutNodes.has(nodeId)) return;

        const partnerId = partnerPairs.get(nodeId);
        const y = level * (NODE_HEIGHT + VERTICAL_SPACING);

        if (partnerId && !layoutNodes.has(partnerId)) {
            // Position couple centered
            const coupleWidth = 2 * NODE_WIDTH + PARTNER_SPACING;
            const x1 = centerX - coupleWidth / 2;
            const x2 = x1 + NODE_WIDTH + PARTNER_SPACING;

            layoutNodes.set(nodeId, {
                id: nodeId,
                x: x1,
                y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                level,
                partnerId,
            });

            layoutNodes.set(partnerId, {
                id: partnerId,
                x: x2,
                y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                level,
                partnerId: nodeId,
            });
        } else if (!partnerId) {
            // Position single node centered
            layoutNodes.set(nodeId, {
                id: nodeId,
                x: centerX - NODE_WIDTH / 2,
                y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                level,
            });
        }

        // Position children
        const children = childrenOf.get(nodeId)?.filter(childId => {
            if (!component.has(childId)) return false;
            if (partnerId) {
                return parentsOf.get(childId)?.has(partnerId);
            }
            return true;
        }) || [];

        if (children.length > 0) {
            const childrenWidths = children.map(childId => subtreeWidth.get(childId) || NODE_WIDTH);
            const totalChildrenWidth = childrenWidths.reduce((sum, w) => sum + w, 0);
            const totalSpacing = (children.length - 1) * HORIZONTAL_SPACING;
            const totalWidth = totalChildrenWidth + totalSpacing;

            let currentX = centerX - totalWidth / 2;

            children.forEach((childId, index) => {
                const childWidth = childrenWidths[index];
                const childCenterX = currentX + childWidth! / 2;
                positionSubtree(childId, childCenterX, level + 1);
                currentX += childWidth! + HORIZONTAL_SPACING;
            });
        }
    }

    // Start positioning from root
    positionSubtree(root, 0, levelAssignments.get(root) || 0);

    // Handle any disconnected nodes in the same component
    sortedLevels.forEach(level => {
        const nodesInLevel = levels.get(level)!;
        nodesInLevel.forEach(nodeId => {
            if (!layoutNodes.has(nodeId)) {
                // Position unconnected nodes to the right
                const maxX = Math.max(...Array.from(layoutNodes.values()).map(n => n.x + NODE_WIDTH));
                positionSubtree(nodeId, maxX + HORIZONTAL_SPACING + NODE_WIDTH / 2, level);
            }
        });
    });

    // Create React Flow nodes
    const finalNodes: Node[] = Array.from(layoutNodes.values()).map(layoutNode => {
        const member = members[layoutNode.id];
        const isDivorced = (member as any)?.isDivorced;

        return {
            id: layoutNode.id,
            type: 'familyMember',
            data: {
                ...member,
                label: member?.name || 'Unknown',
                isDivorced,
            },
            position: {
                x: layoutNode.x,
                y: layoutNode.y
            },
            style: {
                minWidth: `${NODE_WIDTH}px`,
                border: isDivorced ? '2px dashed #9ca3af' : undefined,
                opacity: isDivorced ? 0.85 : 1,
            },
        };
    });

    // Create edges
    const flowEdges: Edge[] = [];
    const processedChildEdges = new Set<string>();
    const processedPartnerPairs = new Set<string>();

    // Parent-child edges
    parentsOf.forEach((parentIds, childId) => {
        if (!component.has(childId) || !members[childId]) return;
        const parents = Array.from(parentIds).filter(p => members[p] && component.has(p));

        let edgeColor = '#94a3b8';

        if (parents.length === 2) {
            const pairKey = parents.sort().join('-');
            if (parentPairColors.has(pairKey)) {
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
                    style: { stroke: edgeColor, strokeWidth: 2 },
                    markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
                });
            }
        });
    });

    // Partner edges
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
        nodes: finalNodes,
        edges: flowEdges,
        members,
    };
}