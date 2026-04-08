/**
 * @module utils/queryOptimization
 * Common query optimization helpers.
 *
 * Usage in routes:
 *   import { USER_SUMMARY_FIELDS, paginationDefaults } from '../utils/queryOptimization';
 *   const users = await User.find(filter).select(USER_SUMMARY_FIELDS).lean();
 */

/** Lightweight projection for user lookups used in populates. */
export const USER_SUMMARY_FIELDS = 'firstName lastName email role';

/** Lightweight projection for provider listings. */
export const PROVIDER_LIST_FIELDS =
  'userId professionalInfo.bio professionalInfo.specialties serviceAreas availability.isAcceptingClients status';

/** Default pagination values. */
export function paginationDefaults(query: {
  page?: string | number;
  limit?: string | number;
}): { page: number; limit: number; skip: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}
