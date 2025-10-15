import { useRef } from 'react';
import {
    Download,
    Upload,
    Undo,
    Redo,
    Grid3x3
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
    applyLayout,
    importFamilyTree as importFamilyTreeAction,
    setNodes
} from '@/stores/slices/familyTreeSlice';
import { addHistory, undo as undoAction, redo as redoAction } from '@/stores/slices/historySlice';
import { getLayoutedElements, type LayoutDirection } from '@/utils/layoutUtils';
import { exportFamilyTree, importFamilyTree } from '@/utils/exportUtils';

const FamilyTreeToolbar = () => {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const nodes = useAppSelector(state => state.familyTree.nodes);
    const edges = useAppSelector(state => state.familyTree.edges);
    const members = useAppSelector(state => state.familyTree.members);
    const canUndo = useAppSelector(state => state.history.canUndo);
    const canRedo = useAppSelector(state => state.history.canRedo);

    // Auto Layout Handler
    const handleAutoLayout = (direction: LayoutDirection = 'TB') => {
        // Save current state to history
        dispatch(addHistory({ nodes, edges }));

        const { nodes: layoutedNodes, 
            // edges: layoutedEdges 
        } = getLayoutedElements(
            nodes,
            edges,
            {
                direction,
                nodeWidth: 150,
                nodeHeight: 100,
                rankSep: 150,
                nodeSep: 100,
            }
        );

        dispatch(applyLayout(layoutedNodes));
    };

    // Export Handler
    const handleExport = () => {
        try {
            exportFamilyTree(nodes, edges, members);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export family tree');
        }
    };

    // Import Handler
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await importFamilyTree(file);

            // Save current state to history before importing
            dispatch(addHistory({ nodes, edges }));

            dispatch(importFamilyTreeAction({
                nodes: data.nodes,
                edges: data.edges,
                members: data.members,
            }));

            alert('Family tree imported successfully!');
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import family tree');
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Undo Handler
    const handleUndo = () => {
        const previousState = useAppSelector(state => state.history.past[state.history.past.length - 1]);
        if (previousState) {
            dispatch(undoAction());
            dispatch(setNodes(previousState.nodes));
        }
    };

    // Redo Handler
    const handleRedo = () => {
        const nextState = useAppSelector(state => state.history.future[0]);
        if (nextState) {
            dispatch(redoAction());
            dispatch(setNodes(nextState.nodes));
        }
    };

    return (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 flex gap-2">
            {/* Auto Layout */}
            <div className="relative group">
                <button
                    onClick={() => handleAutoLayout('TB')}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Auto Layout (Top to Bottom)"
                >
                    <Grid3x3 className="w-5 h-5" />
                </button>

                {/* Layout direction dropdown */}
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg p-1 hidden group-hover:block">
                    <button
                        onClick={() => handleAutoLayout('TB')}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                    >
                        Top to Bottom
                    </button>
                    <button
                        onClick={() => handleAutoLayout('LR')}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                    >
                        Left to Right
                    </button>
                    <button
                        onClick={() => handleAutoLayout('BT')}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                    >
                        Bottom to Top
                    </button>
                    <button
                        onClick={() => handleAutoLayout('RL')}
                        className="block w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                    >
                        Right to Left
                    </button>
                </div>
            </div>

            <div className="w-px bg-gray-300" />

            {/* Undo */}
            <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
            >
                <Undo className="w-5 h-5" />
            </button>

            {/* Redo */}
            <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
            >
                <Redo className="w-5 h-5" />
            </button>

            <div className="w-px bg-gray-300" />

            {/* Export */}
            <button
                onClick={handleExport}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Export Family Tree"
            >
                <Download className="w-5 h-5" />
            </button>

            {/* Import */}
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Import Family Tree"
            >
                <Upload className="w-5 h-5" />
            </button>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
            />
        </div>
    );
};

export default FamilyTreeToolbar;