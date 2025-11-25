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
      // Only increment unread count if the notification is unread
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      const notificationToDelete = state.notifications.find((n) => n.relatedId === action.payload);
      state.notifications = state.notifications.filter((n) => n.relatedId !== action.payload);
      // Update unread count if the deleted notification was unread
      if (notificationToDelete && !notificationToDelete.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, deleteNotification, markAsRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
