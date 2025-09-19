const authAPI = {
    login: async (email: string, password: string) => {
        // Mock API call
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
        return response.json()
    },

    googleLogin: async (googleToken: string) => {
        const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleToken }),
        })
        return response.json()
    },

    register: async (userData: { email: string; password: string; name: string }) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        })
        return response.json()
    },

    refreshToken: async (refreshToken: string) => {
        const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        })
        return response.json()
    },
}

export default authAPI;