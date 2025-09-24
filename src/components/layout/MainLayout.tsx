import type { LayoutProps } from "@/types/common";

const MainLayout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="m-w-screen h-screen">
            <div className="h-[70px] border-b">Navbar</div>
            <div className="flex h-full">
                <div className="w-[20%] border-r">Sidebar</div>
                {children}
            </div>
        </div>
    );
}

export default MainLayout;