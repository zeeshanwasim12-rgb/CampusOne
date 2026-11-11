/**
 * chatController — REST side of the chat feature (Socket.IO handles live
 * delivery in sockets/chatSocket.js; these endpoints load history, create
 * rooms and compute unread counts, and also work as a fallback if sockets are
 * unavailable).
 *
 * Direct rooms are 1:1 and de-duplicated via a deterministic `key`. Group rooms
 * are public community channels any signed-in user can read and post to.
 */
import { ChatRoom, ChatMessage, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOk, sendCreated, sendPaginated, parsePagination } from '../utils/apiResponse.js';
import { emitToRoom, emitToUser } from '../sockets/io.js';

const directKey = (a, b) => [String(a), String(b)].sort().join(':');

async function assertRoomAccess(roomId, user) {
  const room = await ChatRoom.findById(roomId);
  if (!room) throw ApiError.notFound('Chat room not found');
  const isMember = room.members.some((m) => String(m) === String(user._id));
  if (room.type === 'direct' && !isMember) throw ApiError.forbidden('Not a member of this chat');
  return room;
}

async function unreadCount(roomId, userId) {
  return ChatMessage.countDocuments({
    room: roomId,
    sender: { $ne: userId },
    readBy: { $ne: userId },
  });
}

// GET /api/chat/rooms  — my direct rooms + all public group rooms
export const listRooms = asyncHandler(async (req, res) => {
  const rooms = await ChatRoom.find({
    $or: [{ members: req.user._id }, { type: 'group' }],
  })
    .populate('members', 'name role avatarUrl isOnline lastSeenAt')
    .sort({ 'lastMessage.at': -1, updatedAt: -1 });

  const withUnread = await Promise.all(
    rooms.map(async (room) => ({
      ...room.toJSON(),
      unread: await unreadCount(room._id, req.user._id),
    }))
  );
  return sendOk(res, withUnread);
});

// POST /api/chat/rooms/direct  { userId }  — find or create a 1:1 room
export const openDirectRoom = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (String(userId) === String(req.user._id)) throw ApiError.badRequest('Cannot chat with yourself');

  const other = await User.findById(userId);
  if (!other) throw ApiError.notFound('User not found');

  const key = directKey(req.user._id, userId);
  let room = await ChatRoom.findOne({ key });
  if (!room) {
    room = await ChatRoom.create({
      type: 'direct',
      key,
      members: [req.user._id, userId],
      createdBy: req.user._id,
    });
  }
  await room.populate('members', 'name role avatarUrl isOnline lastSeenAt');
  return sendCreated(res, room, 'Chat opened');
});

// GET /api/chat/rooms/:id/messages
export const getMessages = asyncHandler(async (req, res) => {
  await assertRoomAccess(req.params.id, req.user);
  const { page, limit, skip } = parsePagination({ ...req.query, limit: req.query.limit || 40 });

  const [items, total] = await Promise.all([
    ChatMessage.find({ room: req.params.id })
      .populate('sender', 'name role avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ChatMessage.countDocuments({ room: req.params.id }),
  ]);

  // Mark fetched messages as read for this user.
  await ChatMessage.updateMany(
    { room: req.params.id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  // Return in chronological order for the UI.
  return sendPaginated(res, items.reverse(), total, { page, limit });
});

// POST /api/chat/rooms/:id/messages  { text }  (REST fallback for sending)
export const sendMessage = asyncHandler(async (req, res) => {
  const room = await assertRoomAccess(req.params.id, req.user);
  const text = (req.body.text || '').trim();
  if (!text) throw ApiError.badRequest('Message cannot be empty');

  let message = await ChatMessage.create({
    room: room._id,
    sender: req.user._id,
    text,
    readBy: [req.user._id],
  });
  room.lastMessage = { text, sender: req.user._id, at: message.createdAt };
  await room.save();
  message = await message.populate('sender', 'name role avatarUrl');

  // Live-deliver to everyone currently in the room, and notify absent members.
  emitToRoom(room._id, 'chat:message', message.toJSON());
  room.members
    .filter((m) => String(m) !== String(req.user._id))
    .forEach((m) => {
      emitToUser(m, 'chat:inbox', { roomId: String(room._id) });
    });

  return sendCreated(res, message, 'Sent');
});

// PATCH /api/chat/rooms/:id/read
export const markRead = asyncHandler(async (req, res) => {
  await assertRoomAccess(req.params.id, req.user);
  await ChatMessage.updateMany(
    { room: req.params.id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );
  return sendOk(res, null, 'Marked read');
});

// GET /api/chat/users?search=  — people you can start a chat with
export const searchChatUsers = asyncHandler(async (req, res) => {
  const filter = { _id: { $ne: req.user._id }, isActive: true };
  if (req.query.search) filter.name = new RegExp(req.query.search.trim(), 'i');
  const users = await User.find(filter)
    .select('name role avatarUrl isOnline lastSeenAt')
    .sort({ isOnline: -1, name: 1 })
    .limit(25);
  return sendOk(res, users);
});

export default {
  listRooms,
  openDirectRoom,
  getMessages,
  sendMessage,
  markRead,
  searchChatUsers,
};
