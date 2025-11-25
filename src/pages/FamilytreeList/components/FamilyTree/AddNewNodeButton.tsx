import { Plus } from "lucide-react";

interface AddNewNodeButtonProps {
    onOpen?: () => void;
}

const AddNewNodeButton: React.FC<AddNewNodeButtonProps> = (data) => {
    return (
        <div className="flex items-center justify-center w-44 h-16 bg-white border-2 border-dashed border-gray-300 rounded-xl shadow-sm hover:border-gray-400 transition-colors">
            <button
                onClick={data.onOpen}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-600"
            >
                <Plus size={20} />
                <span className="text-sm font-medium">THÊM THÀNH VIÊN</span>
            </button>
        </div>
    );
};

export default AddNewNodeButton;