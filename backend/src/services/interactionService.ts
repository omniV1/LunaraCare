/**
 * @module services/interactionService
 * Tracks user interactions with resources: views, downloads, favorites,
 * and ratings. Provides aggregate statistics per resource and manages
 * the UserResourceInteraction model.
 */

import mongoose from 'mongoose';
import UserResourceInteraction, { IUserResourceInteraction } from '../models/UserResourceInteraction';
import { BadRequestError, NotFoundError } from '../utils/errors';

// ── Input types ──────────────────────────────────────────────────────────────

/** Fields for recording a resource interaction. */
export interface RecordInteractionInput {
  resourceId: string;
  interactionType: string;
  rating?: number;
}

// ── Result types ─────────────────────────────────────────────────────────────

/** Aggregate interaction statistics for a single resource. */
export interface ResourceStats {
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  averageRating: number;
  totalRatings: number;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Record a user interaction with a resource. Handles rating upsert,
 * favorite toggle, and view/download creation.
 *
 * @param userId - Authenticated user's ObjectId
 * @param data - Interaction details (type, resource, optional rating)
 * @returns Interaction result and HTTP status code
 * @throws BadRequestError — missing fields, invalid type, or invalid rating
 */
export async function recordInteraction(
  userId: mongoose.Types.ObjectId,
  data: RecordInteractionInput
): Promise<{ result: Record<string, unknown>; status: number }> {
  const { resourceId, interactionType, rating } = data;

  if (!resourceId || !interactionType) {
    throw new BadRequestError('resourceId and interactionType are required');
  }

  const validTypes = ['view', 'download', 'favorite', 'rating'];
  if (!validTypes.includes(interactionType)) {
    throw new BadRequestError(`interactionType must be one of: ${validTypes.join(', ')}`);
  }

  if (interactionType === 'rating') {
    if (rating == null || rating < 1 || rating > 5) {
      throw new BadRequestError('Rating must be a number between 1 and 5');
    }

    const updated = await UserResourceInteraction.findOneAndUpdate(
      { user: userId, resource: resourceId, interactionType: 'rating' },
      { rating },
      { upsert: true, new: true }
    );
    return { result: updated.toObject() as unknown as Record<string, unknown>, status: 200 };
  }

  if (interactionType === 'favorite') {
    const existing = await UserResourceInteraction.findOne({
      user: userId,
      resource: resourceId,
      interactionType: 'favorite',
    });

    if (existing) {
      await existing.deleteOne();
      return { result: { message: 'Favorite removed', favorited: false }, status: 200 };
    }

    const interaction = new UserResourceInteraction({
      user: userId,
      resource: resourceId,
      interactionType: 'favorite',
    });
    await interaction.save();
    return { result: { ...(interaction.toObject() as unknown as Record<string, unknown>), favorited: true }, status: 201 };
  }

  // For view and download, always create a new record
  const interaction = new UserResourceInteraction({
    user: userId,
    resource: resourceId,
    interactionType,
  });
  await interaction.save();
  return { result: interaction.toObject() as unknown as Record<string, unknown>, status: 201 };
}

/**
 * Get current user's favorited resources.
 *
 * @param userId - Authenticated user's ObjectId
 * @returns Favorite interactions with populated resource details
 */
export async function getFavorites(
  userId: mongoose.Types.ObjectId
): Promise<IUserResourceInteraction[]> {
  return UserResourceInteraction.find({
    user: userId,
    interactionType: 'favorite',
  }).populate('resource');
}

/**
 * Get interaction stats for a resource.
 *
 * @param resourceId - Resource ObjectId string
 * @returns Aggregated view, download, favorite, and rating statistics
 */
export async function getResourceStats(resourceId: string): Promise<ResourceStats> {
  const [viewCount, downloadCount, favoriteCount, ratingAgg] = await Promise.all([
    UserResourceInteraction.countDocuments({ resource: resourceId, interactionType: 'view' }),
    UserResourceInteraction.countDocuments({ resource: resourceId, interactionType: 'download' }),
    UserResourceInteraction.countDocuments({ resource: resourceId, interactionType: 'favorite' }),
    UserResourceInteraction.aggregate([
      { $match: { resource: resourceId, interactionType: 'rating' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
        },
      },
    ]),
  ]);

  const ratingStats = ratingAgg[0] ?? { averageRating: 0, totalRatings: 0 };

  return {
    viewCount,
    downloadCount,
    favoriteCount,
    averageRating: Math.round((ratingStats.averageRating ?? 0) * 10) / 10,
    totalRatings: ratingStats.totalRatings,
  };
}

/**
 * Remove a resource from favorites.
 *
 * @param userId - Authenticated user's ObjectId
 * @param resourceId - Resource ObjectId string
 * @throws NotFoundError — favorite not found
 */
export async function removeFavorite(
  userId: mongoose.Types.ObjectId,
  resourceId: string
): Promise<void> {
  const deleted = await UserResourceInteraction.findOneAndDelete({
    user: userId,
    resource: resourceId,
    interactionType: 'favorite',
  });

  if (!deleted) {
    throw new NotFoundError('Favorite not found');
  }
}
