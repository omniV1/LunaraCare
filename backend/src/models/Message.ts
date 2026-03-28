import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessageDocument extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  title?: string;
  read: boolean;
  type?: 'text' | 'image' | 'file' | 'system';
  createdAt: Date;
}

export interface IMessageModel extends Model<IMessageDocument> {
  findConversation(conversationId: mongoose.Types.ObjectId): Promise<IMessageDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - conversationId
 *         - sender
 *         - receiver
 *         - content
 *       properties:
 *         id:
 *           type: string
 *         conversationId:
 *           type: string
 *         sender:
 *           type: string
 *         receiver:
 *           type: string
 *         content:
 *           type: string
 *         read:
 *           type: boolean
 *           default: false
 *         type:
 *           type: string
 *           enum: [text, image, file, system]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    title: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, read: 1, createdAt: -1 });

messageSchema.static('findConversation', function (conversationId: mongoose.Types.ObjectId) {
  return this.find({ conversationId }).sort({ createdAt: 1 }).exec();
});

const Message = mongoose.model<IMessageDocument, IMessageModel>('Message', messageSchema);
export default Message;
