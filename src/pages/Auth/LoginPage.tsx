import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { loginUser, clearError, googleLogin } from '@/stores/slices/authSlice'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'
import { Users, Eye, EyeOff } from 'lucide-react'
import type { LoginProps } from '@/types/auth'

const LoginPage: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth)
    const [rememberMe, setRememberMe] = useState(false);
    const [formData, setFormData] = useState<LoginProps>({
        username: '',
        password: '',
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
        await dispatch(loginUser(formData))
        console.log(error);
        
    }

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            // The credential is a JWT token from Google
            const token = credentialResponse.credential

            // Dispatch the googleLogin action with the token
            await dispatch(googleLogin({ token })).unwrap()

            // Navigation will be handled by the useEffect when isAuthenticated becomes true
        } catch (error) {
            console.error('Google login failed:', error)
        }
    }

    const handleGoogleError = () => {
        console.error('Google Sign-In failed')
        // Optionally show an error message to the user
    }

    return (
        <>
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
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
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Nhập email"
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
                    <Link
                        to="/forgot-password"
                        className="text-blue-100 hover:text-white"
                    >
                        Quên mật khẩu?
                    </Link>
                    <label className="flex items-center text-blue-100">
                        <input
                            type="checkbox"
                            name="rememberMe"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                            className="w-4 h-4 mr-2 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-white/30"
                        />
                        Lưu mật khẩu
                    </label>
                </div>

                {/* Login button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-800 hover:bg-blue-900 disabled:bg-blue-800/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    {isLoading ? 'ĐANG NHẬP...' : 'ĐĂNG NHẬP'}
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

                {/* Google Sign In */}
                <div className="mt-6">
                    <GoogleSignInButton
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                    />
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
        </>
    )
}

export default LoginPage