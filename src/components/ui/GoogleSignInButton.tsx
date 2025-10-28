import { useEffect, useRef, useState } from 'react'

interface GoogleSignInButtonProps {
    onSuccess: (response: any) => void
    onError?: () => void
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    onSuccess,
    onError
}) => {
    const buttonRef = useRef<HTMLDivElement>(null)
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)
    const initializeAttempted = useRef(false)

    // Load Google script
    useEffect(() => {
        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')

        if (existingScript) {
            // Script already loaded
            if (window.google) {
                setIsScriptLoaded(true)
            } else {
                // Script is loading, wait for it
                existingScript.addEventListener('load', () => {
                    setIsScriptLoaded(true)
                })
            }
            return
        }

        // Load new script
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true

        script.onload = () => {
            setIsScriptLoaded(true)
        }

        script.onerror = () => {
            console.error('Failed to load Google Sign-In script')
            onError?.()
        }

        document.body.appendChild(script)

        return () => {
            // Don't remove script on cleanup to avoid reloading on navigation
        }
    }, [])

    // Initialize Google Sign-In when script is loaded
    useEffect(() => {
        if (!isScriptLoaded || !window.google || !buttonRef.current || initializeAttempted.current) {
            return
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        console.log('Google Client ID (env):', import.meta.env.VITE_GOOGLE_CLIENT_ID);

        if (!clientId) {
            console.error('Google Client ID is not configured in environment variables')
            onError?.()
            return
        }

        try {
            console.log('Initializing Google Sign-In...')
            initializeAttempted.current = true

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
            })

            // Clear any existing content
            if (buttonRef.current) {
                buttonRef.current.innerHTML = ''

                window.google.accounts.id.renderButton(
                    buttonRef.current,
                    {
                        theme: 'filled_blue',
                        size: 'large',
                        width: buttonRef.current.offsetWidth || 300,
                        text: 'continue_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                        locale: 'vi',
                    }
                )
                console.log('Google Sign-In button rendered successfully')
            }
        } catch (error) {
            console.error('Error initializing Google Sign-In:', error)
            initializeAttempted.current = false
            onError?.()
        }
    }, [isScriptLoaded, onSuccess, onError])

    const handleCredentialResponse = (response: any) => {
        if (response.credential) {
            console.log('Google Sign-In successful')
            onSuccess(response)
        } else {
            console.error('No credential received from Google')
            onError?.()
        }
    }

    return (
        <div className="w-full">
            <div
                ref={buttonRef}
                className="w-full flex justify-center min-h-[40px]"
            >
                {!isScriptLoaded && (
                    <div className="w-full py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center">
                        Đang tải Google Sign-In...
                    </div>
                )}
            </div>
        </div>
    )
}

export default GoogleSignInButton