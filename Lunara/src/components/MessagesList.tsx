/**
 * @module components/MessagesList
 * Unread notifications feed — polls for unread messages every 10 seconds
 * and receives real-time updates via WebSocket. Supports batch "clear all"
 * and distinguishes system (document/appointment) from personal messages.
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../api/apiClient';
import { useSocket } from '../hooks/useSocket';

interface Message {
  _id: string;
  conversationId: string;
  sender: { _id?: string; firstName?: string; lastName?: string; email?: string } | string;
  receiver: { _id?: string; firstName?: string; lastName?: string; email?: string } | string;
  content: string;
  title?: string;
  read: boolean;
  type?: string;
  createdAt: string;
}

interface MessagesListProps {
  onNotificationCleared?: () => void;
}

/** Renders the unread notifications list with real-time updates and clear-all. */
export const MessagesList: React.FC<MessagesListProps> = ({ onNotificationCleared }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { onNewMessage } = useSocket();

  useEffect(() => {
    loadMessages();
    loadUnreadCount();

    // Refresh every 10 seconds to check for new messages (fallback if sockets are disconnected)
    const interval = setInterval(() => {
      loadMessages();
      loadUnreadCount();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Realtime updates via websocket — only add to list if unread (notifications = unread only)
  useEffect(() => {
    const unsubscribe = onNewMessage((payload) => {
      if (payload.read) return;
      setMessages(prev => {
        // Deduplicate: both the 10s polling interval and websocket can deliver
        // the same message, so skip if we already have it by ID.
        if (prev.some(m => String(m._id) === payload.id)) return prev;
        const next: Message = {
          _id: payload.id,
          conversationId: payload.conversationId,
          sender: payload.sender,
          receiver: payload.receiver,
          content: payload.content,
          createdAt: payload.createdAt,
          read: payload.read,
          type: payload.type,
        };
        return [next, ...prev];
      });
      setUnreadCount(prev => prev + 1);
    });
    return unsubscribe;
  }, [onNewMessage]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const apiClient = ApiClient.getInstance();
      const data = await apiClient.get<Message[]>('/messages/unread');
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load messages');
      // Don't clear on error — preserve existing messages so they don't disappear
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const apiClient = ApiClient.getInstance();
      const countResp = await apiClient.get<{ count: number }>('/messages/unread/count');
      setUnreadCount(countResp.count ?? 0);
    } catch {
      // Non-critical - count display will be stale
    }
  };

  const clearAllNotifications = async () => {
    try {
      const apiClient = ApiClient.getInstance();
      await apiClient.put('/messages/read-all', {});
      setMessages([]);
      setUnreadCount(0);
      onNotificationCleared?.();
      toast.success('All notifications cleared');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B4D37]"></div>
      </div>
    );
  }

  // Sort messages by date
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedMessages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-[#BCADA5]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-[#4E1B00]">No notifications yet</h3>
        <p className="mt-2 text-sm text-[#6B4D37]/70">
          Document submissions and alerts will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with unread count and Clear all */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#4E1B00]">Notifications</h2>
            <p className="text-sm text-[#6B4D37]">System alerts and document submissions</p>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <>
                <span className="px-3 py-1 bg-[#AA6641] text-white text-sm font-bold rounded-full animate-pulse">
                  {unreadCount} New
                </span>
                <button
                  type="button"
                  onClick={clearAllNotifications}
                  className="px-4 py-2 bg-[#6B4D37] hover:bg-[#5a402e] text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Clear all notifications
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-3 transition-all duration-300">
        {sortedMessages.map(message => {
          const senderName =
            typeof message.sender === 'object' && message.sender?.firstName
              ? `${message.sender.firstName} ${message.sender.lastName ?? ''}`
              : 'System';

          const isSystemMessage = message.type === 'system';

          return (
            <div
              key={message._id}
              className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-200 ease-in-out ${
                message.read ? 'border-l-4 border-[#CAC3BC]' : 'border-l-4 border-[#AA6641] bg-[#AA6641]/10'
              }`}
            >
              <div>
                  {(() => {
                    const isAppointment = isSystemMessage && (
                      message.title?.toLowerCase().includes('appointment') ||
                      message.content?.toLowerCase().includes('appointment')
                    );
                    const displayTitle = message.title
                      ?? (isSystemMessage ? 'Document Submission' : senderName);

                    return (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isSystemMessage && (
                            isAppointment ? (
                              <svg className="w-5 h-5 text-[#6B4D37] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-[#6B4D37] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )
                          )}
                          <h3 className="text-sm font-semibold text-[#4E1B00]">{displayTitle}</h3>
                          {!message.read && (
                            <span className="px-2 py-0.5 bg-[#AA6641] text-white text-xs font-bold rounded-full">NEW</span>
                          )}
                        </div>

                        <p className={`mt-2 text-sm ${!message.read ? 'text-[#4E1B00] font-medium' : 'text-[#4E1B00]/80'}`}>
                          {message.content}
                        </p>

                        <div className="mt-3 flex items-center gap-4 text-xs text-[#6B4D37]/70">
                          <span className="font-mono">{formatDate(message.createdAt)}</span>
                          {isSystemMessage && (
                            <span className={`px-2 py-1 rounded ${isAppointment ? 'bg-[#DED7CD]/40 text-[#4E1B00]' : 'bg-[#DED7CD]/50 text-[#4E1B00]'}`}>
                              {isAppointment ? 'Appointment' : 'Document'}
                            </span>
                          )}
                        </div>
                      </>
                    );
                  })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
