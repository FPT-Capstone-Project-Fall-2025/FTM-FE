import { useState } from 'react';

interface ErrorPopupState {
    isOpen: boolean;
    message: string;
    timestamp: Date;
}

/**
 * Custom hook for managing error popup state
 * Replaces toast.error with ExceptionPopup for better error visibility
 * 
 * @returns Object containing error popup state and methods
 * 
 * @example
 * const { errorPopup, showError, ErrorPopupComponent } = useErrorPopup();
 * 
 * // Show error
 * showError('Something went wrong');
 * 
 * // Render in component
 * return (
 *   <>
 *     {/* Your component JSX *\/}
 *     <ErrorPopupComponent />
 *   </>
 * );
 */
export function useErrorPopup() {
    const [errorPopup, setErrorPopup] = useState<ErrorPopupState>({
        isOpen: false,
        message: '',
        timestamp: new Date()
    });

    /**
     * Show error popup with message
     * @param message - Error message to display
     */
    const showError = (message: string) => {
        setErrorPopup({
            isOpen: true,
            message,
            timestamp: new Date()
        });
    };

    /**
     * Close error popup
     */
    const closeError = () => {
        setErrorPopup({
            isOpen: false,
            message: '',
            timestamp: new Date()
        });
    };

    return {
        errorPopup,
        showError,
        closeError,
        // Expose state for custom usage
        isErrorOpen: errorPopup.isOpen,
        errorMessage: errorPopup.message,
        errorTimestamp: errorPopup.timestamp
    };
}
