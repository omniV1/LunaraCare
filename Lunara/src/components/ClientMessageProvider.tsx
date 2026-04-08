/**
 * @module components/ClientMessageProvider
 * Client-facing messaging view for communicating with the assigned provider.
 * Loads the client profile to resolve the provider, then shows a single
 * conversation thread with WebSocket live delivery and REST fallback.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ApiClient } from '../api/apiClient';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/useAuth';
import { toast } from 'react-toastify';

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

function getPartyId(party: MessageItem['sender']): string {
  return typeof party === 'string' ? party : party?._id ? String(party._id) : '';
}

function getPartyName(party: MessageItem['sender']): string {
  if (typeof party === 'string') return 'Provider';
  const first = party?.firstName ?? '';
  const last = party?.lastName ?? '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return full || 'Provider';
}

function getErrorMessage(e: unknown): string | undefined {
  if (isRecord(e) && isRecord(e.response) && isRecord(e.response.data) && typeof e.response.data.error === 'string') {
    return e.response.data.error;
  }
  return e instanceof Error ? e.message : undefined;
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

interface ClientMeResponse {
  _id: string;
  userId?: { _id: string; firstName?: string; lastName?: string; email?: string };
  assignedProvider?: null | {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

/** Renders the client-to-provider messaging thread with real-time support. */
export const ClientMessageProvider: React.FC = () => {
  const [provider, setProvider] = useState<ClientMeResponse['assignedProvider']>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [conversationIds, setConversationIds] = useState<string[]>([]);
  const [providerConversationId, setProviderConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { connected, joinConversation, sendMessage, onNewMessage } = useSocket();
  const myUserId = user?.id ?? getUserId(user);

  const providerIdStr =
    provider && typeof provider === 'object' && provider._id
      ? String(provider._id)
      : '';

  const providerName = provider
    ? [provider.firstName, provider.lastName].filter(Boolean).join(' ') || provider.email || 'Your provider'
    : '';

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const api = ApiClient.getInstance();
      const data = await api.get<ClientMeResponse>('/client/me');
      setProvider(data?.assignedProvider ?? null);
    } catch {
      setProvider(null);
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadVersionRef = useRef(0);
  const loadConversation = useCallback(async () => {
    if (!providerIdStr) {
      setMessages([]);
      setConversationIds([]);
      return;
    }
    const version = ++loadVersionRef.current;
    setConversationLoading(true);
    try {
      const api = ApiClient.getInstance();
      const data = await api.get<{ messages: MessageItem[] }>('/messages/for-me');
      if (version !== loadVersionRef.current) return; // stale, ignore
      const list = data.messages ?? [];
      setMessages(list);
      const cids = [...new Set(list.map((m: MessageItem) => m.conversationId).filter(Boolean))] as string[];
      setConversationIds(cids);
      cids.forEach((cid) => joinConversation(cid));
      const withProvider = list.find(
        (m: MessageItem) =>
          getPartyId(m.sender) === providerIdStr ||
          getPartyId(m.receiver) === providerIdStr
      );
      setProviderConversationId(withProvider?.conversationId ?? null);
    } catch {
      if (version !== loadVersionRef.current) return;
      toast.error('Failed to load messages');
      // Don't clear on error — preserve existing messages so they don't disappear
    } finally {
      if (version === loadVersionRef.current) {
        setConversationLoading(false);
      }
    }
  }, [providerIdStr, joinConversation]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useEffect(() => {
    const unsub = onNewMessage((payload) => {
      setMessages((prev) => {
        const isForMe = String(payload.receiver) === myUserId || String(payload.sender) === myUserId;
        if (!isForMe) return prev;
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
  }, [onNewMessage, myUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !providerIdStr) return;
    const api = ApiClient.getInstance();
    setSending(true);
    setInput('');
    const cid = providerConversationId;
    try {
      if (cid && connected && myUserId) {
        const sent = sendMessage({
          conversationId: cid,
          sender: myUserId,
          receiver: providerIdStr,
          message: text,
        });
        if (sent) {
          setMessages((prev) => [
            ...prev,
            {
              _id: `temp-${Date.now()}`,
              conversationId: cid,
              sender: myUserId,
              receiver: providerIdStr,
              content: text,
              createdAt: new Date().toISOString(),
              read: false,
            },
          ]);
          return;
        }
      }
      const body: { receiver: string; content: string; conversationId?: string } = {
        receiver: providerIdStr,
        content: text,
      };
      if (cid) body.conversationId = cid;
      const result = await api.post<MessageItem | { data?: MessageItem; conversationId?: string }>(
        '/messages',
        body
      );
      const msg = isRecord(result) && 'data' in result ? (result as { data?: MessageItem }).data : (result as MessageItem);
      const cidFromResult = isRecord(result) ? (result as { conversationId?: string }).conversationId : undefined;
      const cidFromMsg = isRecord(msg) ? (msg as { conversationId?: string }).conversationId : undefined;
      const newCid = cidFromMsg ?? cidFromResult ?? cid;
      if (newCid && !conversationIds.includes(newCid)) {
        setConversationIds((prev) => [...prev, newCid]);
        setProviderConversationId((prev) => prev || newCid);
        joinConversation(newCid);
      }
      setMessages((prev) => {
        const resolvedId = isRecord(msg) && typeof msg._id === 'string' ? msg._id : String(Date.now());
        const newMsg = {
          _id: resolvedId,
          conversationId: newCid ?? cid ?? '',
          sender: (isRecord(msg) ? (msg as { sender?: MessageItem['sender'] }).sender : undefined) ?? myUserId,
          receiver: (isRecord(msg) ? (msg as { receiver?: MessageItem['receiver'] }).receiver : undefined) ?? providerIdStr,
          content: text,
          createdAt: (isRecord(msg) ? (msg as { createdAt?: string }).createdAt : undefined) ?? new Date().toISOString(),
          read: false,
        };
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
    } catch (e: unknown) {
      toast.error(getErrorMessage(e) ?? 'Failed to send');
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (profileLoading) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-[#DED7CD] bg-white">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-[#6B4D37] border-t-transparent" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-[#DED7CD] bg-white">
        <div className="text-center text-[#6B4D37] p-6">
          <p className="font-medium">No assigned provider</p>
          <p className="text-sm mt-2">You don’t have an assigned provider yet. Once one is assigned, you’ll be able to message them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-[#DED7CD] bg-white overflow-hidden max-h-[80vh]" style={{ height: '600px', maxHeight: '80dvh' }}>
      <div className="px-4 py-3 border-b border-[#DED7CD] flex items-center justify-between">
        <div>
          <p className="font-medium text-[#4E1B00]">Message {providerName}</p>
          <p className="text-xs text-[#6B4D37]/70 mt-0.5">
            {connected ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <span className="text-amber-600">Connecting…</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
        {conversationLoading && !messages.length ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 rounded-full border-2 border-[#6B4D37] border-t-transparent" />
          </div>
        ) : (
          <>
            {messages.map((m) => {
              const senderId = getPartyId(m.sender);
              const isMe = !senderId || String(senderId) === myUserId;
              const name = isMe ? 'You' : getPartyName(m.sender);
              return (
                <div
                  key={m._id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      isMe ? 'bg-[#6B4D37] text-white' : 'bg-[#FAF7F2] text-[#4E1B00]'
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
          </>
        )}
      </div>
      <div className="p-3 border-t border-[#DED7CD] bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 min-w-0 rounded-md border border-[#CAC3BC] px-3 py-2 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2 bg-[#6B4D37] text-white text-sm font-medium rounded-md hover:bg-[#5a402e] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};
