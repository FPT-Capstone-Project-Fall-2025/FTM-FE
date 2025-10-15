import React, { useState } from 'react'
import { EyeOff, Eye } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '@/hooks/useApi'
import authService from '@/services/authService'
import type { RegisterProps } from '@/types/auth'

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [agreeToTerm, setAgreeToTerm] = useState(false)
    const [formData, setFormData] = useState<RegisterProps>({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
    })

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const { refetch } = useApi(
        () => authService.register(formData),
        { immediate: false }
    );

    const validateForm = () => {
        const errors: Record<string, string> = {}

        if (formData.name.trim().length < 2) {
            errors.name = 'Họ và tên phải có ít nhất 2 ký tự'
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Vui lòng nhập địa chỉ email hợp lệ'
        }

        if (!/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
            errors.phone = 'Số điện thoại phải có 10-11 chữ số'
        }

        if (formData.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Mật khẩu không khớp'
        }

        if (!agreeToTerm) {
            errors.agreeToTerms = 'Bạn phải đồng ý với các điều khoản và điều kiện'
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))

        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            setIsLoading(true)
            try {
                await refetch();
                setErrorMessage('');
                navigate('/login');
            } catch (err) {
                setErrorMessage('Đăng ký không thành công. Vui lòng thử lại.')
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <>
            <h2 className="text-white text-2xl font-bold text-center mb-6">TẠO TÀI KHOẢN</h2>

            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-500-700 px-4 py-3 rounded mb-6">
                    {errorMessage}
                </div>
            )}

            <div onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Họ và tên
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder='Nhập họ và tên'
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    />
                    {validationErrors.name && (
                        <span className="text-red-500 text-sm mt-1 block">{validationErrors.name}</span>
                    )}
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder='Nhập email'
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    />
                    {validationErrors.email && (
                        <span className="text-red-500 text-sm mt-1 block">{validationErrors.email}</span>
                    )}
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Số điện thoại
                    </label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder='Nhập số điện thoại'
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                    />
                    {validationErrors.phone && (
                        <span className="text-red-500 text-sm mt-1 block">{validationErrors.phone}</span>
                    )}
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Mật khẩu
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu"
                            required
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {validationErrors.password && (
                        <span className="text-red-500 text-sm mt-1 block">{validationErrors.password}</span>
                    )}
                </div>

                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        Xác nhận lại mật khẩu
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Nhập mật khẩu"
                            required
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-100 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    {validationErrors.confirmPassword && (
                        <span className="text-red-500 text-sm mt-1 block">{validationErrors.confirmPassword}</span>
                    )}
                </div>

                <div className="flex items-start">
                    <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={agreeToTerm}
                        onChange={() => setAgreeToTerm(!agreeToTerm)}
                        className="mt-1 mr-2 rounded"
                    />
                    <label className="text-white text-sm">
                        Tôi đồng ý với các điều khoản và điều kiện
                    </label>
                </div>
                {validationErrors.agreeToTerms && (
                    <span className="text-red-500 text-sm block">{validationErrors.agreeToTerms}</span>
                )}

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-blue-800 hover:bg-blue-900 disabled:bg-blue-400 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200"
                >
                    {isLoading ? 'ĐANG TẠO TÀI KHOẢN...' : 'ĐĂNG KÝ'}
                </button>

            </div>
            <div className="mt-6 text-center">
                <span className="text-blue-100">Bạn đã có tài khoản? </span>
                <Link
                    to="/login"
                    className="inline-block px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                    ĐĂNG NHẬP
                </Link>
            </div>
        </>
    )
}

export default RegisterPage