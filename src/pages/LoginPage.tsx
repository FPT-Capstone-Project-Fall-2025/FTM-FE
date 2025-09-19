import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { loginUser, googleLogin, clearError } from '@/stores/slices/authSlice'
import GoogleSignInButton from '@/components/ui/GoogleSignInButton'

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
                <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Sign In</h2>

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
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                            }}
                        />
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
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '24px'
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleInputChange}
                                style={{ marginRight: '8px' }}
                            />
                            Remember me
                        </label>
                        <Link to="/forgot-password" style={{ color: '#007bff', textDecoration: 'none' }}>
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default LoginPage;