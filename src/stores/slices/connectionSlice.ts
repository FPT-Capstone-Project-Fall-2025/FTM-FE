import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ConnectionStatus = "Disconnected" | "Connecting" | "Connected" | "Reconnecting";

interface ConnectionState {
  status: ConnectionStatus;
}

const initialState: ConnectionState = {
  status: "Disconnected",
};

const connectionSlice = createSlice({
  name: "connection",
  initialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.status = action.payload;
    },
  },
});

export const { setConnectionStatus } = connectionSlice.actions;
export default connectionSlice.reducer;
