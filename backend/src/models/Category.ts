import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for the category document
export interface ICategoryDocument extends Document {
  name: string;
  description: string;
  parentCategory?: mongoose.Types.ObjectId | null;
  subcategories: mongoose.Types.ObjectId[];

  // Virtual properties
  readonly fullPath: string;
  readonly isRoot: boolean;
  readonly hasSubcategories: boolean;

  // Instance methods
  getSubcategories(): Promise<ICategoryDocument[]>;
  getFullPath(): string;
  moveToParent(newParentId?: mongoose.Types.ObjectId): Promise<void>;
}

// Interface for the category model
export interface ICategoryModel extends Model<ICategoryDocument> {
  findRootCategories(): Promise<ICategoryDocument[]>;
  findByParent(parentId: mongoose.Types.ObjectId): Promise<ICategoryDocument[]>;
  findAllCategories(): Promise<ICategoryDocument[]>;
  getCategoryTree(): Promise<ICategoryDocument[]>;
}

/**
 * Swagger documentation for the Category Model
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated category ID
 *         name:
 *           type: string
 *           description: Category name
 *         description:
 *           type: string
 *           description: Category description
 *         parentCategory:
 *           type: string
 *           description: Reference to parent category (for hierarchical structure)
 *         subcategories:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of subcategory IDs
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

// Category Schema
const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    subcategories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Add virtual id property to match other models
categorySchema.virtual('id').get(function (this: { _id: mongoose.Types.ObjectId }) {
  return this._id ? this._id.toHexString() : undefined;
});

// Virtual to get full hierarchical path
categorySchema.virtual('fullPath').get(function (this: ICategoryDocument): string {
  return this.getFullPath();
});

// Virtual to check if category is root (no parent)
categorySchema.virtual('isRoot').get(function (this: ICategoryDocument): boolean {
  return !this.parentCategory;
});

// Virtual to check if category has subcategories
categorySchema.virtual('hasSubcategories').get(function (this: ICategoryDocument): boolean {
  return this.subcategories && this.subcategories.length > 0;
});

// Helper to store old parentCategory before update
let oldParentCategoryCache: mongoose.Types.ObjectId | null = null;

categorySchema.pre<ICategoryDocument>('save', async function (next) {
  // Prevent circular references
  if (this.parentCategory?.equals(this._id as mongoose.Types.ObjectId)) {
    return next(new Error('Category cannot be its own parent'));
  }

  // Cache old parent before update
  if (!this.isNew && this.isModified('parentCategory')) {
    // Use correct typing for constructor
    const original = await (this.constructor as typeof Category)
      .findById(this._id)
      .select('parentCategory');
    oldParentCategoryCache = original ? (original.parentCategory ?? null) : null;
  } else {
    oldParentCategoryCache = null;
  }
  next();
});

// Handle parent update after save
categorySchema.post<ICategoryDocument>('save', async function (doc) {
  // Remove from old parent's subcategories if parent changed
  if (oldParentCategoryCache && !doc.parentCategory?.equals(oldParentCategoryCache)) {
    await Category.findByIdAndUpdate(oldParentCategoryCache, { $pull: { subcategories: doc._id } });
  }
  // Add to new parent's subcategories
  if (doc.parentCategory) {
    await Category.findByIdAndUpdate(doc.parentCategory, { $addToSet: { subcategories: doc._id } });
  }
  oldParentCategoryCache = null;
});

// For findOneAndUpdate
categorySchema.pre('findOneAndUpdate', async function (next) {
  // @ts-ignore
  const update = this.getUpdate();
  // Only check if update is a plain object (not aggregation pipeline)
  if (
    update &&
    !Array.isArray(update) &&
    typeof update === 'object' &&
    'parentCategory' in update
  ) {
    // @ts-ignore
    const docToUpdate = await this.model.findOne(this.getQuery()).select('parentCategory');
    // @ts-ignore
    this._oldParentCategory = docToUpdate ? docToUpdate.parentCategory : null;
  }
  next();
});

categorySchema.post('findOneAndUpdate', async function (doc) {
  // @ts-ignore
  const oldParent = this._oldParentCategory;
  if (doc && oldParent && !doc.parentCategory?.equals(oldParent)) {
    await Category.findByIdAndUpdate(oldParent, { $pull: { subcategories: doc._id } });
  }
  if (doc?.parentCategory) {
    await Category.findByIdAndUpdate(doc.parentCategory, { $addToSet: { subcategories: doc._id } });
  }
});

// Instance method to get subcategories with population
categorySchema.methods.getSubcategories = function (
  this: ICategoryDocument
): Promise<ICategoryDocument[]> {
  return Category.find({
    _id: { $in: this.subcategories },
  }).sort({ name: 1 });
};

// Instance method to get full hierarchical path
categorySchema.methods.getFullPath = async function (this: ICategoryDocument): Promise<string> {
  // Creates an array starting with the current category
  const path: string[] = [this.name];
  // While the category has a parent...
  while (this.parentCategory) {
    // Find the parent category
    const parent = await Category.findById(this.parentCategory);
    // If there is a parent...
    if (parent) {
      // Add the parent name to the beginning of the path
      path.unshift(parent.name);
      // Go up a parent
      this.parentCategory = parent.parentCategory;
    }
  }
  // Return the path array as a string with ' > ' between each category
  return path.join(' > ');
};

// Instance method to move category to new parent
categorySchema.methods.moveToParent = async function (
  this: ICategoryDocument,
  newParentId?: mongoose.Types.ObjectId
): Promise<void> {
  const oldParentId = this.parentCategory;

  // Update this category's parent
  this.parentCategory = newParentId || null;
  await this.save();

  // Remove from old parent's subcategories
  if (oldParentId) {
    await Category.findByIdAndUpdate(oldParentId, { $pull: { subcategories: this._id } });
  }

  // Add to new parent's subcategories
  if (newParentId) {
    await Category.findByIdAndUpdate(newParentId, { $addToSet: { subcategories: this._id } });
  }
};

// Static method to find root categories
categorySchema.statics.findRootCategories = function (): Promise<ICategoryDocument[]> {
  return this.find({
    parentCategory: null,
  }).sort({ name: 1 });
};

// Static method to find categories by parent
categorySchema.statics.findByParent = function (
  parentId: mongoose.Types.ObjectId
): Promise<ICategoryDocument[]> {
  return this.find({
    parentCategory: parentId,
  }).sort({ name: 1 });
};

// Static method to find all categories
categorySchema.statics.findAllCategories = function (): Promise<ICategoryDocument[]> {
  return this.find({}).sort({ name: 1 });
};

// Function to get the full category tree
categorySchema.statics.getCategoryTree = async function (
  maxDepth = 10
): Promise<ICategoryDocument[]> {
  const rootCategories = await this.find({ parentCategory: null }).sort({ name: 1 });
  const visited = new Set<string>();

  // Recursive method with visited set and depth check
  const buildTree = async (
    categories: ICategoryDocument[],
    depth: number
  ): Promise<ICategoryDocument[]> => {
    if (depth > maxDepth)
      throw new Error('Category tree nesting too deep (possible circular reference)');
    for (const category of categories) {
      if (visited.has(String(category._id))) continue; // Prevent cycles
      visited.add(String(category._id));
      const subcategories = await this.find({ parentCategory: category._id }).sort({ name: 1 });
      if (subcategories.length > 0) {
        category.subcategories = subcategories.map((sub: ICategoryDocument) => sub._id);
        await buildTree(subcategories, depth + 1);
      }
    }
    return categories;
  };
  return buildTree(rootCategories, 1);
};

// Indexes for performance
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ name: 'text', description: 'text' }); // Text search (includes name)

const Category = mongoose.model<ICategoryDocument, ICategoryModel>('Category', categorySchema);

export default Category;
