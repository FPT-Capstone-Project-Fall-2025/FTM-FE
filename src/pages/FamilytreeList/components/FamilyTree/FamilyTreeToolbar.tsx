import { useRef } from 'react';
import {
    Download,
    Upload,
    Grid3x3,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    ArrowLeft
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
    applyLayout,
    importFamilyTree as importFamilyTreeAction,
} from '@/stores/slices/familyTreeSlice';
import { getLayoutedElements, type LayoutDirection } from '@/utils/layoutUtils';
import { exportFamilyTree, importFamilyTree } from '@/utils/exportUtils';

const FamilyTreeToolbar = () => {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const nodes = useAppSelector(state => state.familyTree.nodes);
    const edges = useAppSelector(state => state.familyTree.edges);
    const members = useAppSelector(state => state.familyTree.members);

    // Auto Layout Handler
    const handleAutoLayout = (direction: LayoutDirection = 'TB') => {
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

    return (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-2 flex gap-2">
            {/* Auto Layout */}
            <div className="relative group">
                <button
                    onClick={() => handleAutoLayout('TB')}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Tự động sắp xếp"
                >
                    <Grid3x3 className="w-5 h-5" />
                </button>

                {/* Layout direction dropdown */}
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1 hidden group-hover:block z-10 min-w-[180px]">
                    <button
                        onClick={() => handleAutoLayout('TB')}
                        className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm transition-colors"
                    >
                        <ArrowDown className="w-4 h-4 text-blue-500" />
                        <span>Trên xuống dưới</span>
                    </button>
                    <button
                        onClick={() => handleAutoLayout('LR')}
                        className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm transition-colors"
                    >
                        <ArrowRight className="w-4 h-4 text-blue-500" />
                        <span>Trái sang phải</span>
                    </button>
                    <button
                        onClick={() => handleAutoLayout('BT')}
                        className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm transition-colors"
                    >
                        <ArrowUp className="w-4 h-4 text-blue-500" />
                        <span>Dưới lên trên</span>
                    </button>
                    <button
                        onClick={() => handleAutoLayout('RL')}
                        className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-blue-50 rounded text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-blue-500" />
                        <span>Phải sang trái</span>
                    </button>
                </div>
            </div>
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