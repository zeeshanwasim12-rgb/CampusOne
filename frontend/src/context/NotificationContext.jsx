import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

/**
 * Tracks the live unread-notification count and unread chat rooms.
 * Subscribes to socket events so badges update in real time.
 */
export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnread(data.data.count ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      setChatUnread(0);
      return undefined;
    }
    refreshUnread();

    const socket = getSocket();
    const onNotification = (n) => {
      setUnread((c) => c + 1);
      toast(n.title || 'New notification', { icon: '🔔' });
    };
    const onInbox = () => setChatUnread((c) => c + 1);

    socket.on('notification:new', onNotification);
    socket.on('chat:inbox', onInbox);
    return () => {
      socket.off('notification:new', onNotification);
      socket.off('chat:inbox', onInbox);
    };
  }, [isAuthenticated, refreshUnread]);

  const value = {
    unread,
    chatUnread,
    setUnread,
    clearChatUnread: () => setChatUnread(0),
    refreshUnread,
  };
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
