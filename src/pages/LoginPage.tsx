import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { loginUser, googleLogin, clearError } from '@/stores/slices/authSlice'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'
import { Users, Eye, EyeOff } from 'lucide-react'
import heroImg from "@/assets/auth/login-hero.png"

const LoginPage: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth)

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    })

    const [showPassword, setShowPassword] = useState(false)
    const from = (location.state as any)?.from?.pathname || '/dashboard'

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true })
        }
        return () => {
            dispatch(clearError())
        }
    }, [isAuthenticated, navigate, from, dispatch])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch(loginUser({ email: formData.email, password: formData.password }))
    }

    const handleGoogleSuccess = (token: string) => {
        dispatch(googleLogin(token))
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Section - Family Photos */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full max-w-lg">
                        <img src={heroImg} alt="Khám phá cây gia phả của gia đình bạn"/>
                    </div>
                </div>
            </div>

            {/* Right Section - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-blue-500 to-blue-700">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">ĐĂNG NHẬP</h1>
                        <p className="text-blue-100">Tên Đăng Nhập</p>
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
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Nhập email hoặc số điện thoại"
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                            />
                        </div>

                        {/* Password input */}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="Nhập mật khẩu"
                                required
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-100 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Remember me and Forgot password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center text-blue-100">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    className="w-4 h-4 mr-2 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-white/30"
                                />
                                Lưu mật khẩu
                            </label>
                            <Link 
                                to="/forgot-password" 
                                className="text-blue-100 hover:text-white"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-800 hover:bg-blue-900 disabled:bg-blue-800/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            {isLoading ? 'ĐANG NHẬP...' : 'ĐĂNG NHẬP'}
                        </button>

                        {/* Google Sign In */}
                        <div className="mt-6">
                            <GoogleSignInButton onSuccess={handleGoogleSuccess} />
                        </div>
                    </form>

                    {/* Sign up link */}
                    <div className="mt-8 text-center">
                        <span className="text-blue-100">Bạn chưa có tài khoản? </span>
                        <Link 
                            to="/register" 
                            className="inline-block px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200"
                        >
                            ĐĂNG KÝ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginPage