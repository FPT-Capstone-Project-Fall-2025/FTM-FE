import { useRef } from 'react';
import {
    Download,
    Upload,
    RotateCcw
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
    importFamilyTree as importFamilyTreeAction,
    resetToInitialLayout,
} from '@/stores/slices/familyTreeSlice';
import { exportFamilyTree, importFamilyTree } from '@/utils/exportUtils';

const FamilyTreeToolbar = () => {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const nodes = useAppSelector(state => state.familyTree.nodes);
    const edges = useAppSelector(state => state.familyTree.edges);
    const members = useAppSelector(state => state.familyTree.members);

    // Reset Layout Handler - restores original TB layout
    const handleResetLayout = () => {
        dispatch(resetToInitialLayout());
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
            {/* Reset Layout */}
            <button
                onClick={handleResetLayout}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Khôi phục cấu trúc gốc"
            >
                <RotateCcw className="w-5 h-5" />
            </button>

            <div className="w-px bg-gray-300" />

            {/* Export */}
            <button
                onClick={handleExport}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Xuất cây gia phả"
            >
                <Download className="w-5 h-5" />
            </button>

            {/* Import */}
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Nhập cây gia phả"
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