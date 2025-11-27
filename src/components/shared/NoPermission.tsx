import { ShieldOff } from 'lucide-react';
const NoPermission = () => {
    return (
        <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 max-w-md">
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                        <ShieldOff className="w-10 h-10 text-red-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Không có quyền truy cập
                </h2>
                <p className="text-gray-600 mb-2">
                    Bạn không có quyền xem nội dung này.
                </p>
                <p className="text-sm text-gray-500">
                    Vui lòng liên hệ với chủ sở hữu gia phả để được cấp quyền truy cập.
                </p>
            </div>
        </div>
    );
};
export default NoPermission;
