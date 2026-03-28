import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ApiClient } from '../api/apiClient';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/useAuth';
import { toast } from 'react-toastify';

type UserLike = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function getUserId(v: unknown): string {
  if (typeof v === 'string') return v;
  if (!isRecord(v)) return '';
  const raw = v._id ?? v.id;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  return raw != null ? String(raw) : '';
}

function getUserName(v: unknown): { name: string; email?: string } {
  if (!isRecord(v)) return { name: 'Client' };
  const u = v as UserLike;
  const first = u.firstName ?? '';
  const last = u.lastName ?? '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return { name: full || u.email || 'Client', email: u.email };
}

interface ClientItem {
  _id: string;
  userId?: UserLike | string;
  user?: UserLike | string;
}

interface MessageItem {
  _id: string;
  conversationId: string;
  sender: string | { _id?: string; firstName?: string; lastName?: string };
  receiver: string | { _id?: string; firstName?: string; lastName?: string };
  content: string;
  createdAt: string;
  read?: boolean;
}

export const MessageCenter: React.FC = () => {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { connected, joinConversation, sendMessage, onNewMessage } = useSocket();
  const myUserId = user?.id ?? getUserId(user);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  const clientIdStr = getUserId(selectedClient?.userId ?? selectedClient?.user);

  const clientName = selectedClient ? getUserName(selectedClient.userId ?? selectedClient.user).name : '';

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const api = ApiClient.getInstance();
      const res = await api.get<ClientItem[] | { clients?: ClientItem[] }>('/providers/me/clients');
      const list = Array.isArray(res) ? res : res?.clients ?? [];
      setClients(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Failed to load clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVersionRef = useRef(0);
  const lastLoadedClientRef = useRef<string | null>(null);
  const loadConversation = useCallback(async () => {
    if (!clientIdStr) {
      setMessages([]);
      setConversationId(null);
      lastLoadedClientRef.current = null;
      return;
    }
    const version = ++loadVersionRef.current;
    const isNewClient = lastLoadedClientRef.current !== clientIdStr;
    if (isNewClient) {
      lastLoadedClientRef.current = clientIdStr;
      setMessages([]);
    }
    setLoading(true);
    try {
      const api = ApiClient.getInstance();
      const data = await api.get<{ conversationId: string | null; messages: MessageItem[] }>(
        `/messages/with/${clientIdStr}`
      );
      if (version !== loadVersionRef.current) return;
      setMessages(data.messages ?? []);
      setConversationId(data.conversationId ?? null);
      if (data.conversationId) {
        joinConversation(data.conversationId);
      }
    } catch {
      if (version !== loadVersionRef.current) return;
      toast.error('Failed to load conversation');
      if (isNewClient) {
        lastLoadedClientRef.current = null;
      }
      // Don't clear on refetch error — preserve messages so they don't disappear
    } finally {
      if (version === loadVersionRef.current) {
        setLoading(false);
      }
    }
  }, [clientIdStr, joinConversation]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;
  useEffect(() => {
    const unsub = onNewMessage((payload) => {
      setMessages((prev) => {
        if (payload.conversationId !== conversationIdRef.current) return prev;
        if (prev.some((m) => String(m._id) === payload.id)) return prev;
        const newMsg = {
          _id: payload.id,
          conversationId: payload.conversationId,
          sender: payload.sender,
          receiver: payload.receiver,
          content: payload.content,
          createdAt: payload.createdAt,
          read: payload.read,
        };
        // If we sent this (socket path), replace our optimistic temp message instead of appending
        const sentByMe = String(payload.sender) === myUserId;
        if (sentByMe) {
          const withoutTemp = prev.filter(
            (m) => !(String(m._id).startsWith('temp-') && m.content === payload.content)
          );
          return [...withoutTemp, newMsg];
        }
        return [...prev, newMsg];
      });
    });
    return unsub;
  }, [conversationId, onNewMessage, myUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !clientIdStr) return;
    const api = ApiClient.getInstance();
    setSending(true);
    setInput('');
    try {
      if (conversationId && connected && myUserId) {
        const sent = sendMessage({
          conversationId,
          sender: myUserId,
          receiver: clientIdStr,
          message: text,
        });
        if (sent) {
          setMessages((prev) => [
            ...prev,
            {
              _id: `temp-${Date.now()}`,
              conversationId,
              sender: myUserId,
              receiver: clientIdStr,
              content: text,
              createdAt: new Date().toISOString(),
              read: false,
            },
          ]);
          return;
        }
      }
      // First message or socket not connected: send via REST
      const body: { receiver: string; content: string; conversationId?: string } = {
        receiver: clientIdStr,
        content: text,
      };
      if (conversationId) body.conversationId = conversationId;
      const result = await api.post<MessageItem | { data?: MessageItem; conversationId?: string }>(
        '/messages',
        body
      );
      const msg = isRecord(result) && 'data' in result ? (result as { data?: MessageItem }).data : (result as MessageItem);
      const cidFromResult = isRecord(result) ? (result as { conversationId?: string }).conversationId : undefined;
      const cidFromMsg = isRecord(msg) ? (msg as { conversationId?: string }).conversationId : undefined;
      const cid = cidFromMsg ?? cidFromResult ?? conversationId;
      if (cid && !conversationId) {
        setConversationId(cid);
        joinConversation(cid);
      }
      setMessages((prev) => {
        const resolvedId = isRecord(msg) && typeof msg._id === 'string' ? msg._id : String(Date.now());
        const newMsg = {
          _id: resolvedId,
          conversationId: cid ?? conversationId ?? '',
          sender: (isRecord(msg) ? (msg as { sender?: MessageItem['sender'] }).sender : undefined) ?? myUserId,
          receiver: (isRecord(msg) ? (msg as { receiver?: MessageItem['receiver'] }).receiver : undefined) ?? clientIdStr,
          content: text,
          createdAt: (isRecord(msg) ? (msg as { createdAt?: string }).createdAt : undefined) ?? new Date().toISOString(),
          read: false,
        };
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    } catch (e: unknown) {
      const message =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : e instanceof Error
            ? e.message
            : undefined;
      toast.error(message ?? 'Failed to send');
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const showClientList = mobileView === 'list';

  return (
    <div
      className="flex flex-col rounded-2xl border border-dash-border bg-dash-card overflow-hidden max-h-[80vh] shadow-[var(--dash-card-shadow)]"
      style={{ height: '600px', maxHeight: '80dvh' }}
    >
      {/* Mobile header */}
      <div className="md:hidden px-3 py-2 border-b border-dash-section-border flex items-center gap-2 shrink-0">
        {mobileView === 'thread' && selectedClient ? (
          <>
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="px-2 py-1 text-xs font-medium text-[#6B4D37] border border-[#6B4D37]/20 rounded-md shrink-0"
              aria-label="Back to client list"
            >
              ← Back
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dash-text-primary truncate">{clientName}</p>
              <p className="text-[11px] text-dash-text-secondary/60">
                {connected ? 'Connected' : 'Connecting…'}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-dash-text-primary">My clients</p>
            <p className="text-[11px] text-dash-text-secondary/60">
              {connected ? 'Connected' : 'Connecting…'}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
        {/* Client list — on mobile: either full-screen or completely gone */}
        <div
          className={`border-r border-dash-section-border bg-[#EDE8E0]/30 flex-col min-w-0 ${
            showClientList
              ? 'flex w-full md:w-72 md:shrink-0'
              : 'hidden md:flex md:w-72 md:shrink-0'
          }`}
        >
          {/* Desktop-only sidebar header */}
          <div className="hidden md:block p-3 border-b border-dash-section-border shrink-0">
            <h2 className="font-semibold text-dash-text-primary">My clients</h2>
            <p className="text-xs text-dash-text-secondary/60 mt-0.5">
              {connected ? (
                <span className="text-[#3F4E4F]">Connected</span>
              ) : (
                <span className="text-amber-600">Connecting…</span>
              )}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch">
            {loading && !clients.length ? (
              <div className="p-4 text-dash-text-secondary/60 text-sm">Loading clients…</div>
            ) : (
              <ul className="divide-y divide-dash-section-border">
                {clients.map(c => {
                  const u = c.userId ?? c.user;
                  const info = getUserName(u);
                  const name = info.name;
                  const isSelected = getUserId(u) === clientIdStr;
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClient(c);
                          setMobileView('thread');
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-[#EDE8E0]/50 min-h-[44px] ${
                          isSelected
                            ? 'bg-[#6B4D37]/5 text-[#4E1B00] border-l-2 border-[#6B4D37]'
                            : ''
                        }`}
                      >
                        <p className="font-medium text-dash-text-primary truncate">{name}</p>
                        {info.email && <p className="text-xs text-dash-text-secondary/60 truncate">{info.email}</p>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {!loading && clients.length === 0 && (
              <div className="p-4 text-dash-text-secondary/60 text-sm">
                No clients in your list. Add clients from the My Clients tab.
              </div>
            )}
          </div>
        </div>

        {/* Conversation thread — on mobile: full-screen when a client is selected */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            mobileView === 'thread' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {!selectedClient ? (
            <div className="flex-1 flex items-center justify-center text-dash-text-secondary/60 text-sm px-4 text-center">
              Select a client to start messaging and share what you need in this season—whether
              that involves a baby at home, a pregnancy in progress, or processing a loss.
            </div>
          ) : (
            <>
              {/* Desktop thread header */}
              <div className="hidden md:block px-4 py-2 border-b border-dash-section-border bg-dash-card shrink-0">
                <p className="font-medium text-dash-text-primary">{clientName}</p>
              </div>
              <div
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {messages.map(m => {
                  const sender = m.sender;
                  const senderId = typeof sender === 'string' ? sender : sender?._id;
                  const isMe = !senderId || String(senderId) === myUserId;
                  const name =
                    isMe ||
                    (typeof sender === 'object' &&
                      sender != null &&
                      (sender as { firstName?: string; lastName?: string }).firstName)
                      ? isMe
                        ? 'You'
                        : [
                            (sender as { firstName?: string; lastName?: string }).firstName ?? '',
                            (sender as { firstName?: string; lastName?: string }).lastName ?? '',
                          ]
                            .filter(Boolean)
                            .join(' ') || 'Client'
                      : 'Client';
                  return (
                    <div
                      key={m._id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          isMe ? 'bg-[#6B4D37] text-white' : 'bg-[#EDE8E0]/60 text-dash-text-primary'
                        }`}
                      >
                        <p className="text-xs opacity-80">{name}</p>
                        <p className="text-sm break-words">{m.content}</p>
                        <p className="text-xs mt-1 opacity-70">{formatTime(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-3 border-t border-dash-section-border bg-dash-card shrink-0">
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 min-w-0 rounded-md border border-dash-border px-3 py-2 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="px-4 py-2 bg-[#6B4D37] text-white text-sm font-medium rounded-md hover:bg-[#5a402e] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
