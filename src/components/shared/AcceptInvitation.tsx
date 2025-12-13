import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export default function AcceptInvitation() {
    const [countdown, setCountdown] = useState(5);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleRedirect();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleRedirect = () => {
        setIsRedirecting(true);
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Success Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    {/* Success Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full p-4">
                                <CheckCircle className="w-16 h-16 text-white" strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-gray-800">
                            Bạn đã chấp nhận lời mời tham gia gia tộc
                        </h1>
                        <p className="text-gray-600">
                            Chào mừng bạn đến với gia đình! Hãy đăng nhập để bắt đầu khám phá cây gia phả.
                        </p>
                    </div>

                    {/* Countdown */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">
                            Tự động chuyển hướng đến trang đăng nhập sau
                        </p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">
                            {countdown}s
                        </p>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handleRedirect}
                        disabled={isRedirecting}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRedirecting ? 'Đang chuyển hướng...' : 'Đăng nhập ngay'}
                    </button>
                </div>

                {/* Footer Note */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Nếu bạn không được chuyển hướng tự động, vui lòng nhấn nút phía trên.
                </p>
            </div>
        </div>
    );
}
