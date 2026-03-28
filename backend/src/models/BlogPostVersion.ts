import mongoose, { Schema, Document } from 'mongoose';

// Interface for Blog Post Version document
export interface IBlogPostVersion extends Document {
  blogPostId: mongoose.Types.ObjectId;
  versionNumber: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  tags: string[];
  category: string;
  isPublished: boolean;
  changedBy: mongoose.Types.ObjectId; // User who made the change
  changeReason?: string; // Optional reason for the change
  createdAt: Date;
}

// Blog Post Version Schema
const blogPostVersionSchema = new Schema<IBlogPostVersion>(
  {
    blogPostId: {
      type: Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    featuredImage: String,
    tags: [String],
    category: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changeReason: String,
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
blogPostVersionSchema.index({ blogPostId: 1, versionNumber: -1 });
blogPostVersionSchema.index({ blogPostId: 1, createdAt: -1 });

// Add virtual id property
blogPostVersionSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id ? this._id.toHexString() : undefined;
});

const BlogPostVersion = mongoose.model<IBlogPostVersion>('BlogPostVersion', blogPostVersionSchema);

export default BlogPostVersion;
