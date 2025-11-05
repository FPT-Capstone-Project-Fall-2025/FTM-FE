import type { ApiResponse } from "@/types/api";
import { startConnection, getConnection } from "./signalRService";
import api from "./apiService";
import type { Notification } from "@/types/notification";

const HUB_URL = "https://be.dev.familytree.io.vn/hubs/notification";

const notificationService = {
    async init(token: string, onReceive: (notif: any) => void) {
        const connection = await startConnection(HUB_URL, token);

        connection?.on("ReceiveNotification", (content) => {
            console.log("Received:", content);
            onReceive({
                id: Date.now(),
                title: content.title || "Thông báo mới",
                message: content.message || content,
                type: content.type || 9003,
                isActionable: content.isActionable ?? false,
                createdAt: content.createdAt || new Date().toISOString(),
                relatedId: content.relatedId || null,
                isRead: false,
            });
        });
    },

    async send(message: any) {
        const connection = getConnection();
        if (!connection) throw new Error("No active SignalR connection");
        await connection.invoke("SendNotification", message);
    },

    getNotifications(): Promise<ApiResponse<Notification[]>> {
        return api.get(`/notifications`);
    },
};

export default notificationService;
