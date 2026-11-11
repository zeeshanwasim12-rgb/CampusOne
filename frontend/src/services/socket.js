import { io } from 'socket.io-client';
import { tokenStore } from './api';

/**
 * Single shared Socket.IO connection.
 * In dev, Vite proxies '/socket.io' to the backend, so we connect to the
 * same origin. In production set VITE_SOCKET_URL to the backend origin.
 *
 * The handshake sends the JWT in `auth.token`; the server verifies it and
 * joins the socket to `user:<id>` (notifications) and any chat rooms.
 */
const URL = import.meta.env.VITE_SOCKET_URL || undefined; // undefined -> same origin

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: tokenStore.access }),
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.auth = { token: tokenStore.access };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
}

export default getSocket;
