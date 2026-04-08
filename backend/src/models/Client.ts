/**
 * @module Client
 * Extended profile for users with the `client` role (postpartum mothers).
 * Maps to the MongoDB `clients` collection.
 * Stores intake/onboarding data, birth experience, feeding preferences,
 * care-plan assignments, and computes postpartum week from baby's birth date.
 * One-to-one with {@link User} via a unique `userId` reference.
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/** Comprehensive intake questionnaire data collected during onboarding. */
export interface IClientProfile {
  // Personal Information
  partnerName?: string;
  partnerPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };

  // Pregnancy & Birth Information
  isFirstBaby?: boolean;
  numberOfChildren?: number;
  previousBirthExperiences?: Array<{
    birthType?: 'vaginal' | 'cesarean' | 'vbac';
    complications?: string[];
    notes?: string;
  }>;
  currentPregnancyComplications?: string[];

  // Birth Experience
  birthExperience?: {
    birthType?: 'vaginal' | 'cesarean' | 'vbac';
    birthLocation?: 'hospital' | 'birth_center' | 'home';
    laborDuration?: number; // in hours
    complications?: string[];
    medicationsUsed?: string[];
    interventions?: string[];
    birthWeight?: number;
    birthLength?: number;
    apgarScores?: {
      oneMinute?: number;
      fiveMinute?: number;
    };
  };

  // Feeding Information
  feedingPreferences?: Array<'breastfeeding' | 'formula' | 'combination' | 'pumping'>;
  feedingChallenges?: string[];
  feedingGoals?: string;

  // Support Needs
  supportNeeds?: Array<
    | 'breastfeeding_support'
    | 'newborn_care'
    | 'emotional_support'
    | 'postpartum_recovery'
    | 'sleep_guidance'
    | 'meal_preparation'
    | 'household_help'
    | 'partner_support'
    | 'sibling_adjustment'
    | 'return_to_work'
  >;
  additionalSupportNeeds?: string;

  // Health Information
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  mentalHealthHistory?: string;
  postpartumMoodConcerns?: boolean;

  // Preferences
  communicationPreferences?: {
    preferredContactMethod?: 'phone' | 'text' | 'email' | 'app';
    bestTimeToContact?: string;
    languagePreference?: string;
  };

  // Goals and Expectations
  postpartumGoals?: string[];
  concernsOrFears?: string[];
  previousDoulaExperience?: boolean;
  expectations?: string;

  // Completed timestamp
  completedAt?: Date;
}

/** Embedded reference to a care plan assigned to this client. */
export interface ICarePlan {
  planId: mongoose.Types.ObjectId;
  assignedDate: Date;
  status: 'active' | 'completed' | 'paused';
}

/** Boolean flags for each step in the client onboarding flow. */
export interface IOnboardingSteps {
  profileCreated: boolean;
  intakeCompleted: boolean;
  providerAssigned: boolean;
  firstContactMade: boolean;
  careplanAssigned: boolean;
}

/** Computed onboarding progress returned by `getOnboardingProgress()`. */
export interface IOnboardingProgress {
  percentage: number;
  completed: number;
  total: number;
  nextStep: string;
}

/** Client profile document with intake data, care plans, and onboarding state. */
export interface IClientDocument extends Document {
  userId: mongoose.Types.ObjectId;
  birthDate?: Date;
  babyBirthDate?: Date;
  dueDate?: Date;
  assignedProvider?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'completed';
  intakeCompleted: boolean;
  intakeData?: IClientProfile;
  postpartumWeek: number;
  carePlans: ICarePlan[];
  providerNotesIntake?: string;
  onboardingSteps: IOnboardingSteps;

  // Virtual properties
  readonly currentPostpartumWeek: number;
  readonly isFourthTrimester: boolean;
  readonly estimatedDueDate: Date | null;

  // Instance methods
  getOnboardingProgress(): IOnboardingProgress;
  getNextOnboardingStep(): string;
}

/** Static helpers on the Client model. */
export interface IClientModel extends Model<IClientDocument> {
  /** Return all clients assigned to a specific provider, with user details populated. */
  findByProvider(providerId: mongoose.Types.ObjectId): Promise<IClientDocument[]>;
  /**
   * Return clients requiring follow-up: incomplete intake after 3 days,
   * no provider after intake, or no first contact after provider assignment.
   */
  findNeedingAttention(): Promise<IClientDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated client profile ID
 *         userId:
 *           type: string
 *           description: Reference to the User document
 *         birthDate:
 *           type: string
 *           format: date
 *           description: Client's birth date
 *         babyBirthDate:
 *           type: string
 *           format: date
 *           description: Baby's birth date
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Expected due date
 *         assignedProvider:
 *           type: string
 *           description: Reference to assigned provider's User ID
 *         status:
 *           type: string
 *           enum: [active, inactive, completed]
 *           description: Client's current status
 *         intakeCompleted:
 *           type: boolean
 *           description: Whether intake form is completed
 *         intakeData:
 *           type: object
 *           description: Intake form responses
 */

const clientSchema = new Schema<IClientDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    birthDate: {
      type: Date,
    },
    babyBirthDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    assignedProvider: {
      type: Schema.Types.ObjectId,
      ref: 'User', // References the User who has role 'provider'
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'completed'],
        message: 'Status must be active, inactive, or completed',
      },
      default: 'active',
    },
    intakeCompleted: {
      type: Boolean,
      default: false,
    },
    intakeData: {
      // Personal Information
      partnerName: String,
      partnerPhone: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
      },

      // Pregnancy & Birth Information
      isFirstBaby: Boolean,
      numberOfChildren: {
        type: Number,
        default: 0,
      },
      previousBirthExperiences: {
        type: [
          {
            birthType: {
              type: String,
              enum: ['vaginal', 'cesarean', 'vbac'],
            },
            complications: [String],
            notes: String,
          },
        ],
        validate: [(v: unknown[]) => v.length <= 20, 'Maximum 20 birth experiences'],
      },
      currentPregnancyComplications: { type: [String], validate: [(v: string[]) => v.length <= 50, 'Maximum 50 items'] },

      // Birth Experience
      birthExperience: {
        birthType: {
          type: String,
          enum: ['vaginal', 'cesarean', 'vbac'],
        },
        birthLocation: {
          type: String,
          enum: ['hospital', 'birth_center', 'home'],
        },
        laborDuration: Number, // in hours
        complications: [String],
        medicationsUsed: [String],
        interventions: [String],
        birthWeight: Number,
        birthLength: Number,
        apgarScores: {
          oneMinute: Number,
          fiveMinute: Number,
        },
      },

      // Feeding Information
      feedingPreferences: [
        {
          type: String,
          enum: ['breastfeeding', 'formula', 'combination', 'pumping'],
        },
      ],
      feedingChallenges: [String],
      feedingGoals: String,

      // Support Needs
      supportNeeds: [
        {
          type: String,
          enum: [
            'breastfeeding_support',
            'newborn_care',
            'emotional_support',
            'postpartum_recovery',
            'sleep_guidance',
            'meal_preparation',
            'household_help',
            'partner_support',
            'sibling_adjustment',
            'return_to_work',
          ],
        },
      ],
      additionalSupportNeeds: String,

      medicalHistory: { type: [String], validate: [(v: string[]) => v.length <= 100, 'Maximum 100 items'] },
      currentMedications: { type: [String], validate: [(v: string[]) => v.length <= 50, 'Maximum 50 items'] },
      allergies: { type: [String], validate: [(v: string[]) => v.length <= 50, 'Maximum 50 items'] },
      mentalHealthHistory: String,
      postpartumMoodConcerns: Boolean,

      // Preferences
      communicationPreferences: {
        preferredContactMethod: {
          type: String,
          enum: ['phone', 'text', 'email', 'app'],
          default: 'app',
        },
        bestTimeToContact: String,
        languagePreference: {
          type: String,
          default: 'english',
        },
      },

      // Goals and Expectations
      postpartumGoals: { type: [String], validate: [(v: string[]) => v.length <= 50, 'Maximum 50 items'] },
      concernsOrFears: { type: [String], validate: [(v: string[]) => v.length <= 50, 'Maximum 50 items'] },
      previousDoulaExperience: Boolean,
      expectations: String,

      // Completed timestamp
      completedAt: Date,
    },

    // Calculated fields
    postpartumWeek: {
      type: Number,
      default: 0,
    },

    // Care plan assignment
    carePlans: [
      {
        planId: {
          type: Schema.Types.ObjectId,
          ref: 'CarePlan',
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'paused'],
          default: 'active',
        },
      },
    ],

    // Notes from provider/doula
    providerNotesIntake: String,

    // Onboarding progress
    onboardingSteps: {
      profileCreated: {
        type: Boolean,
        default: false,
      },
      intakeCompleted: {
        type: Boolean,
        default: false,
      },
      providerAssigned: {
        type: Boolean,
        default: false,
      },
      firstContactMade: {
        type: Boolean,
        default: false,
      },
      careplanAssigned: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * @virtual currentPostpartumWeek — weeks since baby's birth date.
 * Used by the recommendation engine to surface week-appropriate resources.
 */
clientSchema.virtual('currentPostpartumWeek').get(function (this: IClientDocument): number {
  if (!this.babyBirthDate) return 0;

  const now = new Date();
  const birthDate = new Date(this.babyBirthDate);
  const diffTime = Math.abs(now.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
});

/** @virtual isFourthTrimester — true during the first 12 weeks postpartum. */
clientSchema.virtual('isFourthTrimester').get(function (this: IClientDocument): boolean {
  return this.currentPostpartumWeek <= 12;
});

// Virtual to get estimated due date if only birth date is available
clientSchema.virtual('estimatedDueDate').get(function (this: IClientDocument): Date | null {
  if (this.dueDate) return this.dueDate;
  if (this.babyBirthDate) {
    // Estimate due date as 40 weeks before birth date
    const birthDate = new Date(this.babyBirthDate);
    return new Date(birthDate.getTime() - 40 * 7 * 24 * 60 * 60 * 1000);
  }
  return null;
});

/**
 * Pre-save hook: syncs `postpartumWeek` from the virtual, and marks
 * onboarding steps (intakeCompleted, providerAssigned) when conditions are met.
 */
clientSchema.pre<IClientDocument>('save', function (next) {
  if (this.babyBirthDate) {
    this.postpartumWeek = this.currentPostpartumWeek;
  }

  // Update onboarding steps
  if (this.intakeCompleted && this.intakeData) {
    this.onboardingSteps.intakeCompleted = true;
  }

  if (this.assignedProvider) {
    this.onboardingSteps.providerAssigned = true;
  }

  next();
});

// Instance method to check onboarding completion percentage
clientSchema.methods.getOnboardingProgress = function (this: IClientDocument): IOnboardingProgress {
  const steps = this.onboardingSteps;
  const totalSteps = Object.keys(steps).length;
  const completedSteps = Object.values(steps).filter(step => step === true).length;

  return {
    percentage: Math.round((completedSteps / totalSteps) * 100),
    completed: completedSteps,
    total: totalSteps,
    nextStep: this.getNextOnboardingStep(),
  };
};

// Instance method to get next onboarding step
clientSchema.methods.getNextOnboardingStep = function (this: IClientDocument): string {
  const steps = this.onboardingSteps;

  if (!steps.profileCreated) return 'complete_profile';
  if (!steps.intakeCompleted) return 'complete_intake';
  if (!steps.providerAssigned) return 'provider_assignment';
  if (!steps.firstContactMade) return 'first_contact';
  if (!steps.careplanAssigned) return 'care_plan';

  return 'onboarding_complete';
};

// Static method to find clients by provider
clientSchema.statics.findByProvider = function (providerId: mongoose.Types.ObjectId) {
  return this.find({ assignedProvider: providerId }).populate('userId', 'firstName lastName email');
};

// Static method to find clients needing attention
clientSchema.statics.findNeedingAttention = function () {
  return this.find({
    $or: [
      {
        intakeCompleted: false,
        createdAt: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      }, // Incomplete intake after 3 days
      { assignedProvider: null, intakeCompleted: true }, // No provider assigned after intake
      { 'onboardingSteps.firstContactMade': false, assignedProvider: { $ne: null } }, // No first contact after provider assignment
    ],
  });
};

// Indexes
clientSchema.index({ assignedProvider: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ babyBirthDate: 1 });
clientSchema.index({ intakeCompleted: 1 });
clientSchema.index({ createdAt: 1 });

const Client = mongoose.model<IClientDocument, IClientModel>('Client', clientSchema);

export default Client;
