import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, Plus, Search, ArrowLeft, Users, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Avatar from '../components/ui/Avatar';
import Modal from '../components/ui/Modal';
import { api, errMessage, absoluteUrl } from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { timeAgo, formatTime } from '../utils/format';

function roomMeta(room, meId) {
  if (room.type === 'group') {
    return { name: room.name || 'Group', isGroup: true, online: false, avatarName: room.name, avatarSrc: null };
  }
  const other = (room.members || []).find((m) => String(m._id) !== String(meId)) || room.members?.[0];
  return {
    name: other?.name || 'Direct chat',
    isGroup: false,
    online: !!other?.isOnline,
    avatarName: other?.name,
    avatarSrc: absoluteUrl(other?.avatarUrl),
    other,
  };
}

export default function Chat() {
  const { user } = useAuth();
  const { clearChatUnread } = useNotifications();
  const meId = user?._id;

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState('');
  const [typingName, setTypingName] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);

  const activeIdRef = useRef(null);
  const scrollRef = useRef(null);
  const typingTimer = useRef(null);
  const typingSent = useRef(0);

  const activeRoom = useMemo(() => rooms.find((r) => String(r._id) === String(activeId)), [rooms, activeId]);

  const loadRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/rooms');
      setRooms(data.data || data);
    } catch (e) {
      toast.error(errMessage(e, 'Could not load chats'));
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    connectSocket();
    loadRooms();
    clearChatUnread();
  }, [loadRooms, clearChatUnread]);

  // Keep a ref of the active room id for socket handlers.
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const addMessage = useCallback((msg) => {
    setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
    scrollToBottom();
  }, []);

  // Socket listeners (mounted once).
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (msg) => {
      if (String(msg.room) === String(activeIdRef.current)) {
        addMessage(msg);
        socket.emit('chat:read', { roomId: msg.room });
      }
      // Update the room's last-message preview + reordering.
      setRooms((prev) => {
        const idx = prev.findIndex((r) => String(r._id) === String(msg.room));
        if (idx < 0) { loadRooms(); return prev; }
        const updated = { ...prev[idx], lastMessage: { text: msg.text, sender: msg.sender?._id, at: msg.createdAt } };
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    };

    const onInbox = ({ roomId }) => {
      if (String(roomId) === String(activeIdRef.current)) return;
      setRooms((prev) => {
        const idx = prev.findIndex((r) => String(r._id) === String(roomId));
        if (idx < 0) { loadRooms(); return prev; }
        const updated = { ...prev[idx], unread: (prev[idx].unread || 0) + 1 };
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    };

    const onTyping = ({ roomId, name }) => {
      if (String(roomId) !== String(activeIdRef.current)) return;
      setTypingName(name);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(''), 2500);
    };

    const onPresence = ({ userId, isOnline }) => {
      setRooms((prev) =>
        prev.map((r) => ({
          ...r,
          members: (r.members || []).map((m) => (String(m._id) === String(userId) ? { ...m, isOnline } : m)),
        }))
      );
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:inbox', onInbox);
    socket.on('chat:typing', onTyping);
    socket.on('presence:update', onPresence);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:inbox', onInbox);
      socket.off('chat:typing', onTyping);
      socket.off('presence:update', onPresence);
    };
  }, [addMessage, loadRooms]);

  // Open a room: join socket channel, load history, clear unread.
  const openRoom = useCallback(async (room) => {
    const id = room._id;
    setActiveId(id);
    setMessages([]);
    setTypingName('');
    setLoadingMsgs(true);

    const socket = getSocket();
    // Leave previous room, join new one.
    if (activeIdRef.current && activeIdRef.current !== id) socket?.emit('chat:leave', { roomId: activeIdRef.current });
    socket?.emit('chat:join', { roomId: id });

    try {
      const { data } = await api.get(`/chat/rooms/${id}/messages`, { params: { limit: 50 } });
      setMessages(data.data || []);
      scrollToBottom();
      socket?.emit('chat:read', { roomId: id });
      setRooms((prev) => prev.map((r) => (String(r._id) === String(id) ? { ...r, unread: 0 } : r)));
      clearChatUnread();
    } catch (e) {
      toast.error(errMessage(e, 'Could not load messages'));
    } finally {
      setLoadingMsgs(false);
    }
  }, [clearChatUnread]);

  const onType = (e) => {
    setText(e.target.value);
    const now = Date.now();
    if (activeId && now - typingSent.current > 1500) {
      typingSent.current = now;
      getSocket()?.emit('chat:typing', { roomId: activeId });
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean || !activeId) return;
    setText('');
    const socket = getSocket();

    if (socket?.connected) {
      socket.timeout(6000).emit('chat:send', { roomId: activeId, text: clean }, (err, res) => {
        if (err || !res?.ok) {
          // Fall back to REST if the socket ack fails.
          restSend(clean);
        }
        // On success the server emits chat:message back to us (we're in the room),
        // so the message is appended by the listener — nothing to do here.
      });
    } else {
      restSend(clean);
    }
  };

  const restSend = async (clean) => {
    try {
      const { data } = await api.post(`/chat/rooms/${activeId}/messages`, { text: clean });
      addMessage(data.data || data);
    } catch (e) {
      toast.error(errMessage(e, 'Message failed to send'));
      setText(clean);
    }
  };

  const onOpenedDirect = (room) => {
    setRooms((prev) => (prev.some((r) => String(r._id) === String(room._id)) ? prev : [room, ...prev]));
    setNewChatOpen(false);
    openRoom(room);
  };

  const meta = activeRoom ? roomMeta(activeRoom, meId) : null;

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      {/* Room list */}
      <aside className={`w-full flex-col border-r border-slate-100 sm:flex sm:w-80 ${activeId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="flex items-center gap-2 font-bold text-slate-800"><MessageSquare size={18} className="text-brand-600" /> Chats</h2>
          <button onClick={() => setNewChatOpen(true)} className="btn-primary btn-sm px-2 py-1.5"><Plus size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="p-6"><Spinner /></div>
          ) : !rooms.length ? (
            <p className="p-6 text-center text-sm text-slate-400">No conversations yet. Start a new chat.</p>
          ) : (
            rooms.map((room) => {
              const m = roomMeta(room, meId);
              const active = String(room._id) === String(activeId);
              return (
                <button
                  key={room._id}
                  onClick={() => openRoom(room)}
                  className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${active ? 'bg-brand-50' : ''}`}
                >
                  <RoomAvatar meta={m} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-slate-800">{m.name}</span>
                      {room.lastMessage?.at && <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(room.lastMessage.at)}</span>}
                    </div>
                    <p className="truncate text-sm text-slate-400">{room.lastMessage?.text || (m.isGroup ? 'Group channel' : 'Say hi 👋')}</p>
                  </div>
                  {room.unread > 0 && <span className="ml-1 rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">{room.unread}</span>}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`flex-1 flex-col ${activeId ? 'flex' : 'hidden sm:flex'}`}>
        {!activeRoom ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState icon={MessageSquare} title="Select a conversation" message="Choose a chat on the left or start a new one." />
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-slate-100 p-4">
              <button className="sm:hidden" onClick={() => setActiveId(null)}><ArrowLeft size={20} className="text-slate-500" /></button>
              <RoomAvatar meta={meta} />
              <div>
                <h3 className="font-semibold text-slate-800">{meta.name}</h3>
                <p className="text-xs text-slate-400">
                  {meta.isGroup ? `${activeRoom.members?.length || 0} members` : meta.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {loadingMsgs ? (
                <Spinner label="Loading messages…" />
              ) : !messages.length ? (
                <p className="mt-10 text-center text-sm text-slate-400">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((msg) => {
                  const mine = String(msg.sender?._id || msg.sender) === String(meId);
                  return (
                    <div key={msg._id} className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                      {!mine && <Avatar name={msg.sender?.name} src={absoluteUrl(msg.sender?.avatarUrl)} size="sm" />}
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${mine ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-slate-700'}`}>
                        {meta.isGroup && !mine && <p className="mb-0.5 text-xs font-semibold text-brand-600">{msg.sender?.name}</p>}
                        <p className="whitespace-pre-line break-words">{msg.text}</p>
                        <p className={`mt-0.5 text-right text-[10px] ${mine ? 'text-brand-100' : 'text-slate-400'}`}>{formatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              {typingName && <p className="text-xs italic text-slate-400">{typingName} is typing…</p>}
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3">
              <input
                className="input flex-1"
                placeholder="Type a message…"
                value={text}
                onChange={onType}
              />
              <button type="submit" disabled={!text.trim()} className="btn-primary shrink-0 px-3">
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </section>

      <NewChatModal open={newChatOpen} onClose={() => setNewChatOpen(false)} onOpened={onOpenedDirect} />
    </div>
  );
}

function RoomAvatar({ meta }) {
  return (
    <div className="relative shrink-0">
      {meta.isGroup ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Hash size={18} /></span>
      ) : (
        <Avatar name={meta.avatarName} src={meta.avatarSrc} />
      )}
      {!meta.isGroup && meta.online && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}

function NewChatModal({ open, onClose, onOpened }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/chat/users', { params: search ? { search } : {} });
        if (active) setUsers(data.data || data);
      } catch { /* ignore */ } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [search, open]);

  const openDirect = async (u) => {
    setOpening(u._id);
    try {
      const { data } = await api.post('/chat/rooms/direct', { userId: u._id });
      onOpened(data.data || data);
    } catch (e) {
      toast.error(errMessage(e, 'Could not open chat'));
    } finally {
      setOpening(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New chat" size="sm">
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9" placeholder="Search people…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
      </div>
      <div className="max-h-80 space-y-1 overflow-y-auto">
        {loading ? (
          <Spinner />
        ) : !users.length ? (
          <p className="py-6 text-center text-sm text-slate-400">No users found.</p>
        ) : (
          users.map((u) => (
            <button
              key={u._id}
              onClick={() => openDirect(u)}
              disabled={opening === u._id}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50 disabled:opacity-50"
            >
              <div className="relative">
                <Avatar name={u.name} src={absoluteUrl(u.avatarUrl)} size="sm" />
                {u.isOnline && <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white bg-emerald-500" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-700">{u.name}</p>
                <p className="text-xs capitalize text-slate-400">{u.role}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
