import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from "@microsoft/signalr";
import type { AppDispatch } from "@/stores";
import { addNotification } from "@/stores/slices/notificationSlice";
import { setConnectionStatus } from "@/stores/slices/connectionSlice";

let connection: HubConnection | null = null;
let isConnecting = false;
const HUB_URL = "https://be.dev.familytree.io.vn/hubs/notification";

export const initNotificationHub = async (token: string, dispatch: AppDispatch) => {
  if (connection && connection.state !== HubConnectionState.Disconnected) {
    console.log("Hub already connected or connecting, skipping");
    return connection;
  }

  if (isConnecting) {
    console.log("Hub is already connecting...");
    return connection;
  }

  isConnecting = true;

  try {
    if (!connection) {
      connection = new HubConnectionBuilder()
        .withUrl(`${HUB_URL}`, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

      connection.on("ReceiveNotification", (payload) => {
        // Convert numeric type to string if needed
        const notification = {
          ...payload,
          type: typeof payload.type === 'number' ? String(payload.type) : payload.type
        };
        console.log("Notification received:", notification);
        dispatch(addNotification(notification));
      });
    }

    await connection.start();
    dispatch(setConnectionStatus("Connected"));
    console.log("Connected to hub");
  } catch (err) {
    console.error("Hub connection failed:", err);
    dispatch(setConnectionStatus("Disconnected"));
  } finally {
    isConnecting = false;
  }

  return connection;
};


export const stopNotificationHub = async () => {
    if (!connection) return;
    try {
        if (connection.state !== HubConnectionState.Disconnected) {
            await connection.stop();
            console.log("Hub stopped");
        }
    } catch (err) {
        console.warn("Error stopping hub:", err);
    } finally {
        connection = null;
    }
};
