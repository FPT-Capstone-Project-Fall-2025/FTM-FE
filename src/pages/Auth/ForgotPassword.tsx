import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { clearError, forgotPassword } from '@/stores/slices/authSlice'
import { Users } from 'lucide-react'
import { toast } from 'react-toastify'

const ForgotPassword: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth)
    const [email, setEmail] = useState<string>('');
    const [cooldown, setCooldown] = useState<number>(0)

    const from = (location.state as any)?.from?.pathname || '/dashboard'

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true })
        }
        return () => {
            dispatch(clearError())
        }
    }, [isAuthenticated, navigate, from, dispatch])

    // countdown effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setInterval(() => {
                setCooldown(prev => prev - 1)
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [cooldown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (cooldown > 0) return // prevent re-click

        const result = await dispatch(forgotPassword(email));
        if (forgotPassword.fulfilled.match(result)) {
            toast.success('Gửi email thành công!')
            setCooldown(60) // start 60s cooldown
        } else {
            toast.error('Gửi email thất bại!')
        }
    }

    return (
        <>
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
                    <Users className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">QUÊN MẬT KHẨU</h1>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email input */}
                <div>
                    <p className="text-blue-100 pb-2">Tên Đăng Nhập</p>
                    <input
                        type="email"
                        value={email}
                        onChange={(data) => setEmail(data.target.value)}
                        placeholder="Nhập email"
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    />
                </div>
                {/* Submit button */}
                <button
                    type="submit"
                    disabled={isLoading || cooldown > 0}
                    className="w-full py-3 bg-blue-800 hover:bg-blue-900 disabled:bg-blue-800/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    {isLoading
                        ? 'ĐANG GỬI...'
                        : cooldown > 0
                            ? `GỬI LẠI SAU ${cooldown}s`
                            : 'XÁC NHẬN'}
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
            <div className="mt-8 text-center">
                <span className="text-blue-100">Quay lại trang
                    <Link
                        to="/login"
                        className='pl-1 underline'
                    >
                        đăng nhập
                    </Link>
                </span>
            </div>
        </>
    )
}

export default ForgotPassword