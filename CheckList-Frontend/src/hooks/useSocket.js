import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useLogin } from "./useLogin";

export const useSocket = () => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { logedinUser } = useLogin();

  useEffect(() => {
    // Only connect if user is logged in
    if (!logedinUser?.data?._id) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // If socket already exists and is connected, don't create a new one
    if (socketRef.current?.connected) {
      setSocket(socketRef.current);
      setIsConnected(true);
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Get backend URL - use same as axios config
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4040";

    // In dev, connect same-origin so it goes through Vite's /socket.io proxy (no CORS).
    // In production, connect to the backend origin (strip the /api/v1 path).
    const socketUrl = import.meta.env.DEV
      ? undefined
      : backendUrl.replace(/\/api\/v1$/, "").replace(/\/$/, "");
    
    

    // Create socket connection
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = newSocket;
    console.log("[socket] connecting to:", socketUrl);

    newSocket.on("connect", () => {
      console.log("[socket] connected:", newSocket.id);
      setSocket(newSocket);
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.log("[socket] connect_error:", error?.message || error);
      setIsConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("[socket] reconnected, attempt:", attemptNumber);
      setIsConnected(true);
    });

    

    newSocket.on("reconnect_failed", () => {
      console.log("[socket] reconnect_failed");
      setIsConnected(false);
    });

    newSocket.on("dataCreated", (payload) => {
      console.log("[socket] dataCreated received:", payload);
    });

    newSocket.on("dataUpdated", (payload) => {
      console.log("[socket] dataUpdated received:", payload);
    });

  
    // Cleanup on unmount
    return () => {
      if (newSocket && newSocket.connected) {
        console.log("[socket] disconnecting on cleanup");
        newSocket.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [logedinUser?.data?._id]);

  return socket;
};

