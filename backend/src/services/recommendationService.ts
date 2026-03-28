import mongoose from 'mongoose';
import Resources from '../models/Resources';
import Client from '../models/Client';
import ClientDocument from '../models/ClientDocument';
import Category from '../models/Category';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

// ── Result types ─────────────────────────────────────────────────────────────

export interface ResourceRecommendationResult {
  resources: Record<string, unknown>[];
  postpartumWeek: number;
  reason: string;
}

type Suggestion = {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  recommendedWeek: number;
  reason: string;
};

export interface DocumentRecommendationResult {
  suggestions: Suggestion[];
  postpartumWeek: number;
  submittedTypes: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const createOnboardingSuggestions = (submittedTypes: Set<string>): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  if (!submittedTypes.has('personal-assessment')) {
    suggestions.push({
      type: 'personal-assessment',
      title: 'Postpartum Intake & Personal Summary',
      description:
        'Summarize your contact info, family, feeding preferences, support needs, health, and goals from your intake. Use this doc to share updates with your provider and track what matters to you.',
      priority: 'high',
      recommendedWeek: 0,
      reason:
        "Aligns with your intake form so your provider has one place to see your preferences and goals",
    });
  }
  if (!submittedTypes.has('health-assessment')) {
    suggestions.push({
      type: 'health-assessment',
      title: 'Health & Medications Summary',
      description:
        'List current medications, allergies, mental health history, and any mood concerns. Matches the health section of your intake and keeps your care team informed.',
      priority: 'high',
      recommendedWeek: 0,
      reason: 'Important for safe, coordinated postpartum care',
    });
  }
  return suggestions;
};

const createWeekBasedSuggestions = (
  currentWeek: number,
  hasBirthDate: boolean,
  submittedTypes: Set<string>
): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  if (!hasBirthDate) return suggestions;

  if (currentWeek >= 0 && currentWeek <= 2 && !submittedTypes.has('feeding-log')) {
    suggestions.push({
      type: 'feeding-log',
      title: 'Feeding & Pumping Log',
      description:
        'Log nursing/pumping sessions, duration, and any issues. Include your feeding goals from intake (e.g. breastfeeding, formula, combination) so your provider can support you.',
      priority: 'high',
      recommendedWeek: 1,
      reason: 'Weeks 1\u20132 are key for establishing feeding; your provider can help with challenges',
    });
  }

  if (currentWeek >= 0 && currentWeek <= 4 && !submittedTypes.has('sleep-log')) {
    suggestions.push({
      type: 'sleep-log',
      title: 'Sleep & Rest Log',
      description:
        "Track baby and your own sleep patterns, night wakings, and how you\u2019re resting. Helps spot trends and discuss sleep safety and recovery with your provider.",
      priority: 'high',
      recommendedWeek: 2,
      reason: 'Early weeks are when sleep patterns and support needs become clear',
    });
  }

  if (currentWeek >= 1 && currentWeek <= 6 && !submittedTypes.has('mood-check-in')) {
    suggestions.push({
      type: 'mood-check-in',
      title: 'Mood & Emotional Check-In',
      description:
        "Note how you\u2019re feeling, mood changes, anxiety or low mood, and support at home. Ties to your intake mental health and mood-concerns so your provider can follow up.",
      priority: 'high',
      recommendedWeek: 3,
      reason: 'Postpartum mood and mental health are best supported when tracked early',
    });
  }

  if (currentWeek >= 2 && currentWeek <= 8 && !submittedTypes.has('emotional-survey')) {
    suggestions.push({
      type: 'emotional-survey',
      title: 'Emotional Wellness Survey',
      description:
        "Reflect on emotional well-being, coping, and what\u2019s helping. Share with your provider to align with any mental health or mood goals from your intake.",
      priority: 'high',
      recommendedWeek: 4,
      reason: 'Supports ongoing postpartum emotional health through the fourth trimester',
    });
  }

  if (currentWeek >= 4 && currentWeek <= 12 && !submittedTypes.has('recovery-notes')) {
    suggestions.push({
      type: 'recovery-notes',
      title: 'Recovery Milestones & Notes',
      description:
        'Document physical recovery (healing, energy, activity), any symptoms, and questions for your provider. Complements your intake support needs and goals.',
      priority: 'medium',
      recommendedWeek: 6,
      reason: 'Track recovery progress through the fourth trimester',
    });
  }

  if (currentWeek >= 6 && currentWeek <= 12 && !submittedTypes.has('personal-assessment')) {
    suggestions.push({
      type: 'personal-assessment',
      title: 'Fourth Trimester Summary',
      description:
        'Update your summary: how feeding, sleep, mood, and support are going. Aligns with your original intake so your provider sees your journey and current goals.',
      priority: 'medium',
      recommendedWeek: 8,
      reason: 'Useful as you approach the end of the fourth trimester',
    });
  }

  return suggestions;
};

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Get personalized resource recommendations for a client.
 *
 * @throws ForbiddenError — caller is not a client
 * @throws NotFoundError  — client profile not found
 */
export async function getResourceRecommendations(
  userId: mongoose.Types.ObjectId,
  userRole: string
): Promise<ResourceRecommendationResult> {
  if (userRole !== 'client') {
    throw new ForbiddenError('Only clients can access resource recommendations');
  }

  const client = await Client.findOne({ userId });
  if (!client) {
    throw new NotFoundError('Client profile not found');
  }

  const currentWeek = client.currentPostpartumWeek ?? client.postpartumWeek ?? 0;
  const hasBirthDate = !!client.babyBirthDate;

  logger.debug('Resource recommendations - Client:', {
    userId,
    currentWeek,
    hasBirthDate,
    babyBirthDate: client.babyBirthDate ?? null,
    clientId: client._id,
  });

  const query: Record<string, unknown> = { isPublished: true };

  if (hasBirthDate && currentWeek > 0) {
    query.$or = [
      { targetWeeks: { $in: [currentWeek] } },
      { targetWeeks: { $size: 0 } },
      { targetWeeks: { $exists: false } },
    ];
  } else {
    query.$or = [
      { targetWeeks: { $size: 0 } },
      { targetWeeks: { $exists: false } },
    ];
  }

  const recommendedResources = await Resources.find(query)
    .populate('author', 'firstName lastName email')
    .sort({ publishDate: -1, createdAt: -1 })
    .limit(10)
    .lean();

  logger.debug('Found recommended resources:', recommendedResources.length);

  const transformedResources = await Promise.all(
    recommendedResources.map(async (resource) => {
      const mutable = resource as Record<string, unknown>;
      if (mutable.category && typeof mutable.category === 'string') {
        try {
          const category = await Category.findById(mutable.category);
          if (category) {
            mutable.category = {
              id: String(category._id),
              name: category.name,
              description: category.description,
            };
          }
        } catch (error) {
          logger.error('Error fetching category:', error);
          mutable.category = null;
        }
      }
      mutable.id = (mutable._id as { toString(): string }).toString();
      delete mutable._id;
      return mutable;
    })
  );

  const reason =
    hasBirthDate && currentWeek > 0
      ? `Showing resources relevant to your current postpartum week (Week ${currentWeek})`
      : "Showing general resources. Update your baby's birth date to see personalized recommendations.";

  return {
    resources: transformedResources,
    postpartumWeek: currentWeek,
    reason,
  };
}

/**
 * Get document template suggestions based on client progress.
 *
 * @throws ForbiddenError — caller is not a client
 * @throws NotFoundError  — client profile not found
 */
export async function getDocumentRecommendations(
  userId: mongoose.Types.ObjectId,
  userRole: string
): Promise<DocumentRecommendationResult> {
  if (userRole !== 'client') {
    throw new ForbiddenError('Only clients can access document recommendations');
  }

  const client = await Client.findOne({ userId });
  if (!client) {
    throw new NotFoundError('Client profile not found');
  }

  const currentWeek = client.currentPostpartumWeek ?? client.postpartumWeek ?? 0;
  const hasBirthDate = !!client.babyBirthDate;

  logger.debug('Document recommendations - Client:', {
    userId,
    currentWeek,
    hasBirthDate,
    babyBirthDate: client.babyBirthDate ?? null,
    clientId: client._id,
  });

  const submittedDocuments = await ClientDocument.find({
    uploadedBy: userId,
    submissionStatus: { $in: ['submitted-to-provider', 'reviewed-by-provider', 'completed'] },
  }).select('documentType');

  const submittedTypes = new Set(submittedDocuments.map((doc) => doc.documentType));

  const suggestions: Suggestion[] = [];
  if (!hasBirthDate) {
    suggestions.push(...createOnboardingSuggestions(submittedTypes));
  }
  suggestions.push(...createWeekBasedSuggestions(currentWeek, hasBirthDate, submittedTypes));

  suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.recommendedWeek - b.recommendedWeek;
  });

  return {
    suggestions,
    postpartumWeek: currentWeek,
    submittedTypes: Array.from(submittedTypes),
  };
}
