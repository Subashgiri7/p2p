import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
export function useSocket(token: string) {
  const sockRef = useRef<Socket | null>(null);
  useEffect(() => {
    const s = io("/", { auth: { token } });
    sockRef.current = s;
    return () => { s.disconnect(); };
  }, [token]);
  return sockRef;
}