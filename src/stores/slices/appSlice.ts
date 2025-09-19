import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AppState {
    isLoading: boolean
    error: string | null
    notifications: Array<{
        id: string
        message: string
        type: 'success' | 'error' | 'warning'
    }>
}

const initialState: AppState = {
    isLoading: false,
    error: null,
    notifications: [],
}

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload
        },
        addNotification: (state, action: PayloadAction<Omit<AppState['notifications'][0], 'id'>>) => {
            const notification = {
                ...action.payload,
                id: Date.now().toString(),
            }
            state.notifications.push(notification)
        },
        removeNotification: (state, action: PayloadAction<string>) => {
            state.notifications = state.notifications.filter(n => n.id !== action.payload)
        },
    },
})

export const { setLoading, setError, addNotification, removeNotification } = appSlice.actions
export default appSlice.reducer