import { useRef, useState, useEffect } from 'react';
import {
    Download,
    Upload,
    RotateCcw,
    Image,
    Maximize2,
    Minimize2,
    Loader2,
    UserPlus
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
    importFamilyTree as importFamilyTreeAction,
    resetToInitialLayout,
} from '@/stores/slices/familyTreeSlice';
import { exportFamilyTree, importFamilyTree } from '@/utils/exportUtils';
import { toPng } from 'html-to-image';
import { useReactFlow, getNodesBounds, getViewportForBounds } from 'reactflow';

interface FamilyTreeToolbarProps {
    handleInviteUser: () => void;
}

const FamilyTreeToolbar: React.FC<FamilyTreeToolbarProps> = ({ handleInviteUser }) => {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { getNodes } = useReactFlow();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExportingImage, setIsExportingImage] = useState(false);

    const nodes = useAppSelector(state => state.familyTree.nodes);
    const edges = useAppSelector(state => state.familyTree.edges);
    const members = useAppSelector(state => state.familyTree.members);

    // Export as Image – safe, non-blocking, one-at-a-time
    const handleExportImage = async () => {
        if (isExportingImage) return; // Prevent double click
        setIsExportingImage(true);

        const reactFlowElement = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!reactFlowElement) {
            alert('Không tìm thấy cây gia phả để xuất');
            setIsExportingImage(false);
            return;
        }

        // Remove Google Fonts temporarily to avoid CORS
        const googleFontLinks = Array.from(
            document.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="gstatic.com"]')
        );

        googleFontLinks.forEach(link => link.remove());

        try {
            const nodesBounds = getNodesBounds(getNodes());
            const padding = 200;
            const imageWidth = nodesBounds.width + padding;
            const imageHeight = nodesBounds.height + padding;

            const viewport = getViewportForBounds(
                nodesBounds,
                imageWidth,
                imageHeight,
                0.5,
                2,
                0.1
            );

            // Clone viewport off-screen to prevent layout thrashing
            const clone = reactFlowElement.cloneNode(true) as HTMLElement;
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '-9999px';
            clone.style.width = `${imageWidth}px`;
            clone.style.height = `${imageHeight}px`;
            clone.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
            clone.style.transformOrigin = 'top left';
            document.body.appendChild(clone);

            // Use requestIdleCallback to avoid freezing UI
            await new Promise(resolve => requestIdleCallback(() => resolve(null), { timeout: 5000 }));

            const dataUrl = await toPng(clone, {
                backgroundColor: '#f9fafb',
                width: imageWidth,
                height: imageHeight,
                pixelRatio: 2,
                skipFonts: true,
                cacheBust: true,
            });

            // Trigger download
            const link = document.createElement('a');
            link.download = `gia-pha-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();

            // Cleanup
            document.body.removeChild(clone);
        } catch (error) {
            console.error('Export image failed:', error);
            alert('Không thể xuất ảnh cây gia phả');
        } finally {
            // Always restore fonts and reset state
            googleFontLinks.forEach(link => document.head.appendChild(link));
            setIsExportingImage(false);
        }
    };

    // Fullscreen
    const handleFullscreen = () => {
        const container = document.querySelector('.family-tree-main-container') as HTMLElement;
        if (!container) return;

        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(() => {
                alert('Không thể vào chế độ toàn màn hình');
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Other handlers
    const handleResetLayout = () => dispatch(resetToInitialLayout());
    const handleExport = () => exportFamilyTree(nodes, edges, members);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await importFamilyTree(file);
            dispatch(importFamilyTreeAction({
                nodes: data.nodes,
                edges: data.edges,
                members: data.members,
            }));
            alert('Nhập cây gia phả thành công!');
        } catch (err) {
            console.error(err);
            alert('Không thể nhập cây gia phả');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            {/* Loading Overlay */}
            {isExportingImage && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-pulse">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        <div className="text-center">
                            <p className="text-lg font-semibold text-gray-800">Đang tạo ảnh cây gia phả</p>
                            <p className="text-sm text-gray-500 mt-1">Vui lòng đợi một chút...</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-xl p-3 flex gap-3 items-center border border-gray-200">
                {/* Reset */}
                <button
                    onClick={handleResetLayout}
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Khôi phục bố cục gốc"
                >
                    <RotateCcw className="w-5 h-5 text-gray-700" />
                </button>

                <div className="w-px bg-gray-300 h-8" />

                {/* Export JSON */}
                <button
                    onClick={handleExport}
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Xuất JSON"
                >
                    <Download className="w-5 h-5 text-gray-700" />
                </button>

                {/* Export Image */}
                <button
                    onClick={handleExportImage}
                    disabled={isExportingImage}
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
                    title="Xuất ảnh PNG"
                >
                    {isExportingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                        <Image className="w-5 h-5 text-gray-700" />
                    )}
                </button>

                {/* Import */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Nhập cây gia phả"
                >
                    <Upload className="w-5 h-5 text-gray-700" />
                </button>

                {/* Invite */}
                <button
                    onClick={handleInviteUser}
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Mời thành viên"
                >
                    <UserPlus className="w-5 h-5 text-gray-700" />
                </button>

                <div className="w-px bg-gray-300 h-8" />

                {/* Fullscreen */}
                <button
                    onClick={handleFullscreen}
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                >
                    {isFullscreen ? (
                        <Minimize2 className="w-5 h-5 text-gray-700" />
                    ) : (
                        <Maximize2 className="w-5 h-5 text-gray-700" />
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