import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { googleLogin, clearError, registerUser } from '@/stores/slices/authSlice'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'

const RegisterPage: React.FC = () => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    })

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true })
        }
        return () => {
            dispatch(clearError())
        }
    }, [isAuthenticated, navigate, dispatch])

    const validateForm = () => {
        const errors: Record<string, string> = {}

        if (formData.name.trim().length < 2) {
            errors.name = 'Name must be at least 2 characters'
        }

        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address'
        }

        if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters'
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match'
        }

        if (!formData.agreeToTerms) {
            errors.agreeToTerms = 'You must agree to the terms and conditions'
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
            dispatch(registerUser({
                name: formData.name,
                email: formData.email,
                password: formData.password
            }))
        }
    }

    const handleGoogleSuccess = (token: string) => {
        dispatch(googleLogin(token))
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '32px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Create Account</h2>

                <GoogleSignInButton onSuccess={handleGoogleSuccess} />

                <div style={{
                    textAlign: 'center',
                    margin: '16px 0',
                    position: 'relative'
                }}>
                    <span style={{
                        backgroundColor: 'white',
                        padding: '0 16px',
                        color: '#666'
                    }}>or</span>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: '1px',
                        backgroundColor: '#ddd',
                        zIndex: -1
                    }} />
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#fee',
                        color: '#c33',
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '16px',
                        border: '1px solid #fcc'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `1px solid ${validationErrors.name ? '#c33' : '#ddd'}`,
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {validationErrors.name && (
                            <span style={{ color: '#c33', fontSize: '14px' }}>{validationErrors.name}</span>
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `1px solid ${validationErrors.email ? '#c33' : '#ddd'}`,
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {validationErrors.email && (
                            <span style={{ color: '#c33', fontSize: '14px' }}>{validationErrors.email}</span>
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `1px solid ${validationErrors.password ? '#c33' : '#ddd'}`,
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {validationErrors.password && (
                            <span style={{ color: '#c33', fontSize: '14px' }}>{validationErrors.password}</span>
                        )}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: `1px solid ${validationErrors.confirmPassword ? '#c33' : '#ddd'}`,
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {validationErrors.confirmPassword && (
                            <span style={{ color: '#c33', fontSize: '14px' }}>{validationErrors.confirmPassword}</span>
                        )}
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                                style={{ marginRight: '8px' }}
                            />
                            I agree to the{' '}
                            <Link to="/terms" style={{ color: '#007bff', textDecoration: 'none', marginLeft: '4px' }}>
                                Terms and Conditions
                            </Link>
                        </label>
                        {validationErrors.agreeToTerms && (
                            <span style={{ color: '#c33', fontSize: '14px' }}>{validationErrors.agreeToTerms}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default RegisterPage;