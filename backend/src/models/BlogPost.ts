/**
 * @module BlogPost
 * Mongoose model for provider-authored blog content.
 * Maps to the MongoDB `blogposts` collection.
 * Supports draft/publish workflow, auto-generated slugs, estimated read time,
 * full-text search across title/excerpt/content/tags, and view tracking.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/** Blog post document including content, publishing state, and analytics. */
export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: mongoose.Types.ObjectId;
  featuredImage?: string;
  tags: string[];
  category: string;
  isPublished: boolean;
  publishDate?: Date;
  lastSaved?: Date;
  readTime?: number; // estimated reading time in minutes
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Static query helpers on the BlogPost model. */
export interface IBlogPostModel extends Model<IBlogPost> {
  /** Return published posts with optional extra filters, sorted by publish date. */
  findPublished(filters?: Partial<Record<string, unknown>>): Promise<IBlogPost[]>;
  /** Look up a single published post by its URL slug. */
  findBySlug(slug: string): Promise<IBlogPost | null>;
  /** Atomically increment the view counter for a post. */
  incrementViewCount(id: string): Promise<void>;
}

/**
 * Swagger documentation for the BlogPost Model
 * @swagger
 * components:
 *   schemas:
 *     BlogPost:
 *       type: object
 *       required:
 *         - title
 *         - slug
 *         - excerpt
 *         - content
 *         - author
 *         - category
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated blog post ID
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Blog post title
 *         slug:
 *           type: string
 *           description: URL-friendly version of the title
 *         excerpt:
 *           type: string
 *           maxLength: 500
 *           description: Short summary of the blog post
 *         content:
 *           type: string
 *           description: Full content of the blog post (HTML/Markdown)
 *         author:
 *           type: string
 *           description: Mongo ObjectId of the author (User)
 *         featuredImage:
 *           type: string
 *           description: URL of the featured image
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Searchable tags for the blog post
 *         category:
 *           type: string
 *           description: Blog post category
 *         isPublished:
 *           type: boolean
 *           description: Whether the blog post is visible to end users
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: When the blog post was published
 *         lastSaved:
 *           type: string
 *           format: date-time
 *           description: When the blog post was last saved (for drafts)
 *         readTime:
 *           type: number
 *           description: Estimated reading time in minutes
 *         viewCount:
 *           type: number
 *           description: Number of times this post has been viewed
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

// BlogPost Schema
const blogPostSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      maxlength: [500000, 'Content cannot exceed 500KB'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    featuredImage: {
      type: String, // Cloudinary URL
    },
    tags: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishDate: {
      type: Date,
    },
    lastSaved: {
      type: Date,
      default: Date.now,
    },
    readTime: {
      type: Number,
      min: 1,
      max: 60,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** @virtual id — hex-string alias for `_id`, consistent with other models. */
blogPostSchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id ? this._id.toHexString() : undefined;
});

/** @index Full-text search across title, excerpt, content, and tags. */
blogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text', tags: 'text' });
blogPostSchema.index({ category: 1, isPublished: 1 });
blogPostSchema.index({ publishDate: -1 });
blogPostSchema.index({ createdAt: -1 });

/**
 * Pre-save hook: auto-generates a URL slug from the title (if missing),
 * updates `lastSaved`, and estimates read time (~200 wpm).
 */
blogPostSchema.pre<IBlogPost>('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-|-$)/g, '');
  }

  // Update lastSaved timestamp
  this.lastSaved = new Date();

  // Calculate read time (rough estimate: 200 words per minute)
  if (this.isModified('content')) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / 200));
  }

  next();
});

// Static: find published blog posts with optional filters
blogPostSchema.static('findPublished', function (filters: Partial<Record<string, unknown>> = {}) {
  return this.find({ isPublished: true, ...filters })
    .sort({ publishDate: -1, createdAt: -1 })
    .populate('author', 'firstName lastName');
});

// Static: find blog post by slug
blogPostSchema.static('findBySlug', function (slug: string) {
  return this.findOne({ slug, isPublished: true }).populate('author', 'firstName lastName');
});

// Static: increment view count
blogPostSchema.static('incrementViewCount', function (id: string) {
  return this.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
});

// BlogPost model
const BlogPost = mongoose.model<IBlogPost, IBlogPostModel>('BlogPost', blogPostSchema);

export default BlogPost;
