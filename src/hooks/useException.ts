import { useState, useCallback } from 'react';

interface ApiError {
    response?: {
        data?: {
            message?: string;
            Message?: string;
        };
    };
    message?: string;
}

interface ExceptionState {
    isOpen: boolean;
    message: string;
    timestamp: Date;
}

interface UseExceptionReturn {
    isOpen: boolean;
    message: string;
    timestamp: Date;
    showException: (error: string | ApiError) => void;
    hideException: () => void;
}

export const useException = (): UseExceptionReturn => {
    const [state, setState] = useState<ExceptionState>({
        isOpen: false,
        message: '',
        timestamp: new Date(),
    });

    const showException = useCallback((error: string | ApiError) => {
        let errorMessage = '';

        if (typeof error === 'string') {
            errorMessage = error;
        } else if (error && typeof error === 'object') {
            // Try to extract message from API error response
            errorMessage =
                error.response?.data?.message ||
                error.response?.data?.Message ||
                error.message ||
                'Đã xảy ra lỗi không xác định';
        } else {
            errorMessage = 'Đã xảy ra lỗi không xác định';
        }

        setState({
            isOpen: true,
            message: errorMessage,
            timestamp: new Date(),
        });
    }, []);

    const hideException = useCallback(() => {
        setState(prev => ({
            ...prev,
            isOpen: false,
        }));
    }, []);

    return {
        isOpen: state.isOpen,
        message: state.message,
        timestamp: state.timestamp,
        showException,
        hideException,
    };
};
