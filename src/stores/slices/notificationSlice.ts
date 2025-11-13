import type { Notification } from "@/types/notification";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((n) => n.relatedId !== action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.map((n) => n.id === action.payload ? { ...n, isRead: true } : n);
    },
    markAllRead: (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, deleteNotification, markAsRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
