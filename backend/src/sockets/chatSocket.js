/**
 * Socket.IO setup: authentication, presence, and real-time chat.
 *
 * Auth: the client passes its access token in the socket handshake; we resolve
 * it to a user with the same provider abstraction used by the REST API.
 * Each socket joins `user:<id>` (for notifications + inbox pings) and can join
 * `room:<roomId>` channels to receive live messages.
 */
import { resolveUserFromToken } from '../services/authProvider.js';
import { ChatRoom, ChatMessage, User } from '../models/index.js';
import { setIo } from './io.js';
import { logger } from '../utils/logger.js';

async function setPresence(userId, isOnline) {
  await User.updateOne({ _id: userId }, { isOnline, lastSeenAt: new Date() }).catch(() => {});
}

async function canAccessRoom(roomId, userId) {
  const room = await ChatRoom.findById(roomId).select('type members').lean();
  if (!room) return false;
  if (room.type === 'group') return true;
  return room.members.some((m) => String(m) === String(userId));
}

export function initSockets(io) {
  setIo(io);

  // Handshake authentication.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));
      const user = await resolveUserFromToken(token);
      socket.user = { id: String(user._id), name: user.name, role: user.role };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const { id: userId, name } = socket.user;
    socket.join(`user:${userId}`);
    await setPresence(userId, true);
    socket.broadcast.emit('presence:update', { userId, isOnline: true });
    logger.debug(`Socket connected: ${name} (${socket.id})`);

    socket.on('chat:join', async ({ roomId }) => {
      if (await canAccessRoom(roomId, userId)) socket.join(`room:${roomId}`);
    });

    socket.on('chat:leave', ({ roomId }) => socket.leave(`room:${roomId}`));

    socket.on('chat:typing', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('chat:typing', { roomId, userId, name });
    });

    // Send a message over the socket (mirrors the REST endpoint).
    socket.on('chat:send', async ({ roomId, text }, ack) => {
      try {
        const clean = String(text || '').trim();
        if (!clean) return ack?.({ ok: false, error: 'Empty message' });
        if (!(await canAccessRoom(roomId, userId))) return ack?.({ ok: false, error: 'Forbidden' });

        let message = await ChatMessage.create({
          room: roomId,
          sender: userId,
          text: clean,
          readBy: [userId],
        });
        const room = await ChatRoom.findByIdAndUpdate(
          roomId,
          { lastMessage: { text: clean, sender: userId, at: message.createdAt } },
          { new: true }
        );
        message = await message.populate('sender', 'name role avatarUrl');

        io.to(`room:${roomId}`).emit('chat:message', message.toJSON());
        // Ping absent members so their unread badge updates.
        room.members
          .filter((m) => String(m) !== userId)
          .forEach((m) => io.to(`user:${String(m)}`).emit('chat:inbox', { roomId }));

        ack?.({ ok: true, message: message.toJSON() });
      } catch (err) {
        logger.error(`chat:send error: ${err.message}`);
        ack?.({ ok: false, error: 'Failed to send' });
      }
    });

    socket.on('chat:read', async ({ roomId }) => {
      await ChatMessage.updateMany(
        { room: roomId, sender: { $ne: userId }, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
    });

    socket.on('disconnect', async () => {
      await setPresence(userId, false);
      socket.broadcast.emit('presence:update', { userId, isOnline: false });
      logger.debug(`Socket disconnected: ${name}`);
    });
  });
}

export default initSockets;
