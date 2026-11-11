import mongoose from 'mongoose';

/**
 * ChatRoom — a conversation between users.
 *   - type "direct": exactly two members (student-to-student)
 *   - type "group":  a named community/group chat with many members
 *
 * `key` for direct rooms is the two sorted user ids joined by ':' so we can
 * find-or-create a 1:1 room deterministically without duplicates.
 */
const chatRoomSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['direct', 'group'], required: true },
    name: { type: String, default: '' }, // for group rooms
    key: { type: String, index: true, unique: true, sparse: true }, // for direct rooms
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
    },
  },
  { timestamps: true }
);

export const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
export default ChatRoom;
