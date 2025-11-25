import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection | null = null;

export const createHubConnection = (hubUrl: string, token: string) => {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();

  return connection;
};

export const startConnection = async (hubUrl: string, token: string) => {
  const conn = createHubConnection(hubUrl, token);
  try {
    await conn.start();
    console.log("Connected to SignalR hub");
  } catch (err) {
    console.error("SignalR connection error:", err);
  }
  return conn;
};

export const stopConnection = async () => {
  if (connection) {
    await connection.stop();
    console.log("Disconnected from SignalR hub");
    connection = null;
  }
};

export const getConnection = () => connection;
