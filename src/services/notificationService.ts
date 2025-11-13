import type { ApiResponse } from "@/types/api";
import { startConnection, getConnection } from "./signalRService";
import api from "./apiService";
import type { Notification } from "@/types/notification";
import { addNotification } from "@/stores/slices/notificationSlice";

const HUB_URL = "https://be.dev.familytree.io.vn/hubs/notification";

const notificationService = {
    async init(token: string, dispatch: any) {
        const connection = await startConnection(HUB_URL, token);

        connection?.on("ReceiveNotification", (content) => {
            console.log("Received:", content);
            // Convert numeric type to string if needed
            const normalizedNotification: Notification = {
                ...content,
                id: content.id || Date.now().toString(),
                title: content.title || "Thông báo mới",
                message: content.message || content,
                type: typeof content.type === 'number' ? String(content.type) : (content.type || "9003"),
                isActionable: content.isActionable ?? false,
                createdOn: content.createdOn || new Date().toISOString(),
                isRead: content.isRead ?? false,
                userId: content.userId,
                relatedId: content.relatedId,
            };
            // Properly dispatch the Redux action
            dispatch(addNotification(normalizedNotification));
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

    deleteNotifications(relatedId: string): Promise<ApiResponse<any>> {
        return api.delete(`/notifications`, {
            params: {
                relatedId
            }
        });
    },

    invitationResponse(relatedId: string, accepted: boolean): Promise<ApiResponse<any>> {
        return api.get(`/invitation/respond`, {
            params: { relatedId, accepted }
        });
    },
};

export default notificationService;
