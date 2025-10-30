import { useRef, useState, useEffect } from 'react';
import {
    Download,
    Upload,
    RotateCcw,
    Image,
    Maximize2,
    Minimize2,
    Loader2
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
    importFamilyTree as importFamilyTreeAction,
    resetToInitialLayout,
} from '@/stores/slices/familyTreeSlice';
import { exportFamilyTree, importFamilyTree } from '@/utils/exportUtils';
import { toPng } from 'html-to-image';
import { useReactFlow, getNodesBounds, getViewportForBounds } from 'reactflow';

const FamilyTreeToolbar = () => {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { getNodes } = useReactFlow();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExportingImage, setIsExportingImage] = useState(false);

    const nodes = useAppSelector(state => state.familyTree.nodes);
    const edges = useAppSelector(state => state.familyTree.edges);
    const members = useAppSelector(state => state.familyTree.members);

    // Export as Image Handler - Captures entire tree regardless of viewport
    const handleExportImage = async () => {
        setIsExportingImage(true);
        const reactFlowElement = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!reactFlowElement) {
            alert('Không tìm thấy cây gia phả để xuất');
            setIsExportingImage(false);
            return;
        }

        try {
            const nodesBounds = getNodesBounds(getNodes());
            const imageWidth = nodesBounds.width + 200;
            const imageHeight = nodesBounds.height + 200;
            
            const viewport = getViewportForBounds(
                nodesBounds,
                imageWidth,
                imageHeight,
                0.5,
                2,
                0.1
            );

            // Generate image with calculated viewport
            const dataUrl = await toPng(reactFlowElement, {
                backgroundColor: '#f9fafb',
                width: imageWidth,
                height: imageHeight,
                style: {
                    width: `${imageWidth}px`,
                    height: `${imageHeight}px`,
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
                quality: 1,
                pixelRatio: 2,
            });

            // Create download link
            const link = document.createElement('a');
            link.download = `gia-pha-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Export image failed:', error);
            alert('Không thể xuất ảnh cây gia phả');
        } finally {
            setIsExportingImage(false);
        }
    };

    // Fullscreen Handler
    const handleFullscreen = () => {
        const mainContainer = document.querySelector('.family-tree-main-container') as HTMLElement;
        if (!mainContainer) return;

        if (!document.fullscreenElement) {
            mainContainer.requestFullscreen().catch(err => {
                console.error('Fullscreen failed:', err);
                alert('Không thể vào chế độ toàn màn hình');
            });
        } else {
            document.exitFullscreen();
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

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
        <>
            {/* Loading Overlay */}
            {isExportingImage && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <p className="text-gray-700 font-medium">Đang xuất ảnh cây gia phả...</p>
                    </div>
                </div>
            )}

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

                {/* Export JSON */}
                <button
                    onClick={handleExport}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Xuất cây gia phả (JSON)"
                >
                    <Download className="w-5 h-5" />
                </button>

                {/* Export as Image */}
                <button
                    onClick={handleExportImage}
                    disabled={isExportingImage}
                    className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Xuất ảnh cây gia phả"
                >
                    {isExportingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Image className="w-5 h-5" />
                    )}
                </button>

                {/* Import */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title="Nhập cây gia phả"
                >
                    <Upload className="w-5 h-5" />
                </button>

                <div className="w-px bg-gray-300" />

                {/* Fullscreen */}
                <button
                    onClick={handleFullscreen}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                >
                    {isFullscreen ? (
                        <Minimize2 className="w-5 h-5" />
                    ) : (
                        <Maximize2 className="w-5 h-5" />
                    )}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                />
            </div>
        </>
    );
};

export default FamilyTreeToolbar;