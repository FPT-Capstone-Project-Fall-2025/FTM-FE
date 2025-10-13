import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { clearError, resetPassword } from '@/stores/slices/authSlice';
import { LockKeyhole } from 'lucide-react';
import { toast } from 'react-toastify';

const ResetPassword: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading, error } = useAppSelector((state) => state.auth);

    // URL params (userId, code)
    const [userId, setUserId] = useState<string | null>(null);
    const [code, setCode] = useState<string | null>(null);

    // Form fields
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const u = params.get('userId');
        const c = params.get('code');
        setUserId(u);
        setCode(c ? decodeURIComponent(c) : null);

        return () => {
            dispatch(clearError());
        };
    }, [location.search, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId || !code) {
            toast.error('Liên kết không hợp lệ hoặc đã hết hạn.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Mật khẩu xác nhận không khớp.');
            return;
        }

        try {
            await dispatch(
                resetPassword({
                    userId,
                    code,
                    password,
                    confirmPassword
                })
            ).unwrap();

            toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
            navigate('/login');
        } catch (err: any) {
            toast.error(err?.message || 'Không thể đặt lại mật khẩu.');
        }
    };

    return (
        <>
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                    <LockKeyhole className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">ĐẶT LẠI MẬT KHẨU</h1>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* New password */}
                <div>
                    <p className="text-blue-100 pb-2">Mật khẩu mới</p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    />
                </div>

                {/* Confirm password */}
                <div>
                    <p className="text-blue-100 pb-2">Xác nhận mật khẩu</p>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu"
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    />
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-800 hover:bg-blue-900 disabled:bg-blue-800/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    {isLoading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN'}
                </button>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gradient-to-br from-blue-600 to-blue-700 text-blue-100">
                            Hoặc
                        </span>
                    </div>
                </div>
            </form>

            {/* Back link */}
            <div className="mt-8 text-center">
                <span className="text-blue-100">
                    Quay lại trang
                    <Link to="/login" className="pl-1 underline">
                        đăng nhập
                    </Link>
                </span>
            </div>
        </>
    );
};

export default ResetPassword;
