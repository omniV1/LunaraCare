import mongoose from 'mongoose';
import Message, { IMessageDocument } from '../models/Message';
import User from '../models/User';
import Client from '../models/Client';
import { NotFoundError, ForbiddenError } from '../utils/errors';

// ── Input types ──────────────────────────────────────────────────────────────

export interface SendMessageInput {
  conversationId?: string;
  receiver: string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'system';
}

// ── Conversation type ────────────────────────────────────────────────────────

interface ConversationEntry {
  _id: mongoose.Types.ObjectId;
  lastMessage: Record<string, unknown>;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Get all messages for a user (inbox).
 */
export async function getAllMessages(
  userId: mongoose.Types.ObjectId,
  page: number,
  limit: number
): Promise<IMessageDocument[]> {
  return Message.find({ receiver: userId })
    .populate('sender', 'firstName lastName email')
    .populate('receiver', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();
}

/**
 * Get unread messages for a user.
 */
export async function getUnreadMessages(
  userId: mongoose.Types.ObjectId,
  page: number,
  limit: number
): Promise<IMessageDocument[]> {
  return Message.find({ receiver: userId, read: false })
    .populate('sender', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();
}

/**
 * Get unread message count.
 */
export async function getUnreadCount(userId: mongoose.Types.ObjectId): Promise<number> {
  return Message.countDocuments({ receiver: userId, read: false });
}

/**
 * List conversations (distinct conversationIds) for a user.
 */
export async function listConversations(
  userId: mongoose.Types.ObjectId
): Promise<ConversationEntry[]> {
  const conversations: ConversationEntry[] = await Message.aggregate([
    { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
    { $group: { _id: '$conversationId', lastMessage: { $last: '$$ROOT' } } },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $limit: 100 },
  ]);

  const userIds = new Set<string>();
  for (const conv of conversations) {
    const msg = conv.lastMessage as { sender?: { toString(): string }; receiver?: { toString(): string } };
    if (msg.sender) userIds.add(msg.sender.toString());
    if (msg.receiver) userIds.add(msg.receiver.toString());
  }

  const users = await User.find({ _id: { $in: [...userIds] } }, 'firstName lastName email');
  const userMap = new Map(
    users.map((u) => [
      (u._id as mongoose.Types.ObjectId).toString(),
      { id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email },
    ])
  );

  for (const conv of conversations) {
    const msg = conv.lastMessage as Record<string, unknown>;
    const senderId = (msg.sender as { toString(): string })?.toString();
    const receiverId = (msg.receiver as { toString(): string })?.toString();
    if (senderId && userMap.has(senderId)) msg.sender = userMap.get(senderId);
    if (receiverId && userMap.has(receiverId)) msg.receiver = userMap.get(receiverId);
  }

  return conversations;
}

/**
 * Get messages sent to/from the authenticated user.
 */
export async function getMessagesForMe(
  userId: mongoose.Types.ObjectId,
  page: number,
  limit: number
): Promise<IMessageDocument[]> {
  return Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'firstName lastName email')
    .populate('receiver', 'firstName lastName email')
    .lean()
    .exec() as Promise<IMessageDocument[]>;
}

/**
 * Get conversation thread with a specific user.
 */
export async function getConversationWithUser(
  meId: mongoose.Types.ObjectId,
  otherUserId: string
): Promise<{ conversationId: string | null; messages: IMessageDocument[] }> {
  const messages = (await Message.find({
    $or: [
      { sender: meId, receiver: otherUserId },
      { sender: otherUserId, receiver: meId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'firstName lastName email')
    .populate('receiver', 'firstName lastName email')
    .lean()
    .exec()) as IMessageDocument[];

  const first = messages[0] as { conversationId?: { toString(): string } } | undefined;
  const conversationId =
    messages.length > 0 && first?.conversationId != null
      ? first.conversationId.toString()
      : null;

  return { conversationId, messages };
}

/**
 * Get messages in a conversation by conversationId.
 *
 * @throws ForbiddenError — caller is not a participant
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  userRole: string
): Promise<IMessageDocument[]> {
  const isParticipant = await Message.exists({
    conversationId,
    $or: [{ sender: userId }, { receiver: userId }],
  });

  if (!isParticipant && userRole !== 'admin') {
    throw new ForbiddenError('Not a participant in this conversation');
  }

  return Message.findConversation(new mongoose.Types.ObjectId(conversationId));
}

/**
 * Send a new message, verifying the receiver exists and the sender has a relationship.
 *
 * @throws NotFoundError  — receiver not found
 * @throws ForbiddenError — no relationship between sender and receiver
 */
export async function sendMessage(
  data: SendMessageInput,
  senderId: mongoose.Types.ObjectId,
  senderRole: string
): Promise<IMessageDocument> {
  const receiver = await User.findById(data.receiver);
  if (!receiver) {
    throw new NotFoundError('Recipient not found');
  }

  const hasRelationship =
    senderRole === 'admin' ||
    receiver.role === 'admin' ||
    (senderRole === 'provider' &&
      !!(await Client.exists({ userId: data.receiver, assignedProvider: senderId }))) ||
    (senderRole === 'client' &&
      !!(await Client.exists({ userId: senderId, assignedProvider: data.receiver })));

  if (!hasRelationship) {
    throw new ForbiddenError('You can only message users you have a relationship with');
  }

  const message = new Message({
    conversationId: data.conversationId ?? new mongoose.Types.ObjectId(),
    sender: senderId,
    receiver: data.receiver,
    content: data.content,
    type: data.type ?? 'text',
    read: false,
  });
  await message.save();

  await message.populate('sender', 'firstName lastName email');
  await message.populate('receiver', 'firstName lastName email');
  return message;
}

/**
 * Mark all messages as read for a user.
 */
export async function markAllAsRead(userId: mongoose.Types.ObjectId): Promise<void> {
  await Message.updateMany({ receiver: userId, read: false }, { read: true });
}

/**
 * Mark a single message as read.
 *
 * @throws NotFoundError  — message not found
 * @throws ForbiddenError — caller is not the recipient
 */
export async function markMessageAsRead(
  messageId: string,
  userId: string,
  userRole: string
): Promise<IMessageDocument> {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new NotFoundError('Message not found');
  }

  if (message.receiver?.toString() !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Only the recipient can mark a message as read');
  }

  message.read = true;
  await message.save();
  return message;
}

/**
 * Dismiss (permanently delete) a message.
 *
 * @throws NotFoundError — message not found or caller is not sender/receiver
 */
export async function dismissMessage(
  messageId: string,
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const message = await Message.findOne({
    _id: messageId,
    $or: [{ sender: userId }, { receiver: userId }],
  });

  if (!message) {
    throw new NotFoundError('Message not found');
  }

  await Message.findByIdAndDelete(messageId);
}
