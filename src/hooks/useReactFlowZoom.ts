import { useReactFlow } from 'reactflow';
import { useCallback } from 'react';

export const useReactFlowZoom = () => {
    const { setCenter, getNode } = useReactFlow();

    const focusNode = useCallback((nodeId: string, zoom: number = 1.5) => {
        const node = getNode(nodeId);

        if (!node) {
            console.warn(`Node ${nodeId} not found`);
            return;
        }

        const x = node.position.x + (node.width || 150) / 2;
        const y = node.position.y + (node.height || 80) / 2;

        setCenter(x, y, {
            zoom,
            duration: 800 // Smooth animation
        });
    }, [setCenter, getNode]);

    return { focusNode };
};