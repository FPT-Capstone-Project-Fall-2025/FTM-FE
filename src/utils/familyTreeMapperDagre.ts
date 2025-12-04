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

    // NEW: Build spouse clusters (groups of interconnected spouses)
    const spouseClusters = new Map<string, string[]>(); // nodeId -> all partners in cluster
    const processedInCluster = new Set<string>();

    Object.entries(members).forEach(([memberId, member]) => {
        if (!component.has(memberId) || processedInCluster.has(memberId)) return;
        if (!member.partners || member.partners.length === 0) return;

        // BFS to find all interconnected spouses
        const cluster: string[] = [memberId];
        const queue = [memberId];
        const visited = new Set<string>([memberId]);

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            const currentMember = members[currentId];

            if (currentMember?.partners) {
                currentMember.partners.forEach(partnerId => {
                    if (component.has(partnerId) && !visited.has(partnerId)) {
                        visited.add(partnerId);
                        cluster.push(partnerId);
                        queue.push(partnerId);
                    }
                });
            }
        }

        // Assign this cluster to all members in it
        cluster.forEach(id => {
            spouseClusters.set(id, cluster);
            processedInCluster.add(id);
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
    const HORIZONTAL_SPACING = 80;
    const VERTICAL_SPACING = 120;
    const SPOUSE_SPACING = 30; // Space between spouses in a cluster

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

            // Assign same level to all spouses in cluster
            const cluster = spouseClusters.get(id) || [];
            cluster.forEach(spouseId => {
                if (spouseId !== id && !levelAssignments.has(spouseId)) {
                    queue.push({ id: spouseId, level });
                }
            });
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

    // Calculate subtree width for each node/cluster (bottom-up)
    const subtreeWidth = new Map<string, number>();

    function getClusterWidth(nodeId: string): number {
        const cluster = spouseClusters.get(nodeId) || [nodeId];
        return cluster.length * NODE_WIDTH + (cluster.length - 1) * SPOUSE_SPACING;
    }

    function calculateSubtreeWidth(nodeId: string): number {
        if (subtreeWidth.has(nodeId)) {
            return subtreeWidth.get(nodeId)!;
        }

        // Get all people in this spouse cluster
        const cluster = spouseClusters.get(nodeId) || [nodeId];

        // Get ALL children from anyone in this cluster
        const allChildren = new Set<string>();
        cluster.forEach(personId => {
            const children = childrenOf.get(personId) || [];
            children.forEach(childId => {
                if (component.has(childId)) {
                    allChildren.add(childId);
                }
            });
        });

        if (allChildren.size === 0) {
            // Leaf cluster
            const width = getClusterWidth(nodeId);
            cluster.forEach(id => subtreeWidth.set(id, width));
            return width;
        }

        // Calculate total width needed for all children
        const childrenArray = Array.from(allChildren);
        const childrenWidths = childrenArray.map(childId => calculateSubtreeWidth(childId));
        const totalChildrenWidth = childrenWidths.reduce((sum, w) => sum + w, 0);
        const totalChildrenSpacing = (childrenArray.length - 1) * HORIZONTAL_SPACING;
        const childrenRequiredWidth = totalChildrenWidth + totalChildrenSpacing;

        // Cluster width
        const clusterWidth = getClusterWidth(nodeId);

        // Subtree width is the max of cluster width and children width
        const width = Math.max(clusterWidth, childrenRequiredWidth);
        cluster.forEach(id => subtreeWidth.set(id, width));

        return width;
    }

    // Calculate widths for all nodes (starting from leaves)
    sortedLevels.slice().reverse().forEach(level => {
        levels.get(level)!.forEach(nodeId => {
            calculateSubtreeWidth(nodeId);
        });
    });

    // Position nodes level by level (top-down)
    const positionedClusters = new Set<string>(); // Track which clusters we've positioned

    function getClusterKey(nodeId: string): string {
        const cluster = spouseClusters.get(nodeId) || [nodeId];
        return cluster.sort().join('-');
    }

    function positionSubtree(nodeId: string, centerX: number, level: number) {
        const clusterKey = getClusterKey(nodeId);
        if (positionedClusters.has(clusterKey)) return;
        positionedClusters.add(clusterKey);

        const cluster = spouseClusters.get(nodeId) || [nodeId];
        const y = level * (NODE_HEIGHT + VERTICAL_SPACING);

        // Position all spouses in the cluster horizontally
        const clusterWidth = getClusterWidth(nodeId);
        let currentX = centerX - clusterWidth / 2;

        // IMPROVED: For polygamy (2+ partners), put the person with multiple partners in the CENTER
        let sortedCluster = [...cluster];

        if (cluster.length >= 2) {
            // Find the person with multiple partners (the "center" person)
            let centerPerson: string | null = null;
            let maxPartners = 0;

            cluster.forEach(personId => {
                const person = members[personId];
                const partnerCount = person?.partners?.length || 0;
                if (partnerCount > maxPartners) {
                    maxPartners = partnerCount;
                    centerPerson = personId;
                }
            });

            if (centerPerson && maxPartners >= 2) {
                // This is a polygamy case - arrange as: partner1, centerPerson, partner2, ...
                const partners = cluster.filter(id => id !== centerPerson);

                // For 3 people (1 center + 2 partners): partner1, center, partner2
                if (cluster.length === 3) {
                    sortedCluster = [partners[0]!, centerPerson, partners[1]!];
                }
                // For 4+ people: distribute partners on both sides
                else if (cluster.length > 3) {
                    const leftPartners = partners.slice(0, Math.floor(partners.length / 2));
                    const rightPartners = partners.slice(Math.floor(partners.length / 2));
                    sortedCluster = [...leftPartners, centerPerson, ...rightPartners];
                }
                // For 2 people (couple): keep original order
                else {
                    sortedCluster = cluster;
                }
            }
        }

        // Position each person in the cluster
        sortedCluster.forEach((personId) => {
            layoutNodes.set(personId, {
                id: personId,
                x: currentX,
                y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                level,
            });
            currentX += NODE_WIDTH + SPOUSE_SPACING;
        });

        // Get ALL children from the entire cluster
        const allChildren = new Set<string>();
        cluster.forEach(personId => {
            const children = childrenOf.get(personId) || [];
            children.forEach(childId => {
                if (component.has(childId)) {
                    allChildren.add(childId);
                }
            });
        });

        // Position children
        if (allChildren.size > 0) {
            const childrenArray = Array.from(allChildren);
            const childrenWidths = childrenArray.map(childId => subtreeWidth.get(childId) || NODE_WIDTH);
            const totalChildrenWidth = childrenWidths.reduce((sum, w) => sum + w, 0);
            const totalSpacing = (childrenArray.length - 1) * HORIZONTAL_SPACING;
            const totalWidth = totalChildrenWidth + totalSpacing;

            let childX = centerX - totalWidth / 2;

            childrenArray.forEach((childId, index) => {
                const childWidth = childrenWidths[index]!;
                const childCenterX = childX + childWidth / 2;
                positionSubtree(childId, childCenterX, level + 1);
                childX += childWidth + HORIZONTAL_SPACING;
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
                const maxX = Math.max(
                    ...Array.from(layoutNodes.values()).map(n => n.x + NODE_WIDTH),
                    0
                );
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

    // Partner edges - connect ALL partners in sequence
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