import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type FontSize = 'small' | 'medium' | 'large'

interface SettingsState {
    fontSize: FontSize
    minimizeHeader: boolean
}

const initialState: SettingsState = {
    fontSize: 'medium',
    minimizeHeader: false,
}

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setFontSize: (state, action: PayloadAction<FontSize>) => {
            state.fontSize = action.payload
        },
        setMinimizeHeader: (state, action: PayloadAction<boolean>) => {
            state.minimizeHeader = action.payload
        },
        resetSettings: (state) => {
            state.fontSize = initialState.fontSize
            state.minimizeHeader = initialState.minimizeHeader
        },
    },
})

export const { setFontSize, setMinimizeHeader, resetSettings } = settingsSlice.actions
export default settingsSlice.reducer

