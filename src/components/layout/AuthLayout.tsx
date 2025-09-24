import { useAppSelector } from '@/hooks/redux';
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import heroImg from "@/assets/auth/login-hero.png"

const AuthLayout: React.FC = () => {

    const { isAuthenticated } = useAppSelector(state => state.auth)

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Left Section - Family Photos */}
            <div className="lg:flex lg:w-1/2 justify-center items-center">
                <div className="w-full max-w-xl">
                    <img src={heroImg} alt="Khám phá cây gia phả của gia đình bạn"/>
                </div>
            </div>

            {/* Right Section - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-start">
                <div className="w-full max-w-md p-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
