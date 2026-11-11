/**
 * A tiny module that holds the Socket.IO server instance so that any service
 * (notifications, chat) can emit events to a specific user without importing
 * the whole server. Each connected socket joins a room named `user:<id>`, so
 * emitting to a user is just emitting to that room.
 */
let io = null;

export function setIo(instance) {
  io = instance;
}

export function getIo() {
  return io;
}

/** Emit an event to every socket a given user has open. */
export function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${String(userId)}`).emit(event, payload);
}

/** Emit to everyone in a chat room. */
export function emitToRoom(roomId, event, payload) {
  if (!io || !roomId) return;
  io.to(`room:${String(roomId)}`).emit(event, payload);
}

export default { setIo, getIo, emitToUser, emitToRoom };
