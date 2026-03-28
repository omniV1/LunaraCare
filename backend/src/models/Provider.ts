import mongoose, { Schema, Document, Model } from 'mongoose';
import validator from 'validator';

export interface IProfessionalInfo {
  certifications: Array<
    | 'DONA_Birth_Doula'
    | 'DONA_Postpartum_Doula'
    | 'CAPPA_Birth_Doula'
    | 'CAPPA_Postpartum_Doula'
    | 'ToLabor_Birth_Doula'
    | 'ProDoula_Birth_Doula'
    | 'ProDoula_Postpartum_Doula'
    | 'Independent_Training'
    | 'Lactation_Consultant_IBCLC'
    | 'Childbirth_Educator'
    | 'Prenatal_Yoga_Instructor'
    | 'Infant_Massage_Instructor'
    | 'Other'
  >;
  yearsExperience?: number;
  specialties: Array<
    | 'first_time_parents'
    | 'high_risk_pregnancies'
    | 'cesarean_recovery'
    | 'vbac_support'
    | 'multiples_twins'
    | 'breastfeeding_support'
    | 'postpartum_depression'
    | 'infant_sleep_guidance'
    | 'newborn_care'
    | 'sibling_preparation'
    | 'loss_and_grief'
    | 'lgbtq_families'
    | 'teen_mothers'
    | 'military_families'
  >;
  bio?: string;
  education: Array<{
    institution?: string;
    degree?: string;
    year?: number;
    relevantToDoula?: boolean;
  }>;
  languages: string[];
}

export interface IContactInfo {
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
}

export interface ISchedule {
  monday: { available?: boolean; hours?: string };
  tuesday: { available?: boolean; hours?: string };
  wednesday: { available?: boolean; hours?: string };
  thursday: { available?: boolean; hours?: string };
  friday: { available?: boolean; hours?: string };
  saturday: { available?: boolean; hours?: string };
  sunday: { available?: boolean; hours?: string };
}

export interface IAvailability {
  isAcceptingClients: boolean;
  maxClients: number;
  schedule: ISchedule;
  holidaysOff: Date[];
  vacationDates: Array<{
    startDate?: Date;
    endDate?: Date;
    reason?: string;
  }>;
}

export interface IClientAssignment {
  clientId: mongoose.Types.ObjectId;
  assignedDate: Date;
  status: 'active' | 'completed' | 'paused' | 'transferred';
  serviceType?: 'prenatal' | 'birth' | 'postpartum' | 'comprehensive';
}

export interface IPricing {
  hourlyRate?: number;
  packageRates: Array<{
    packageName?: string;
    description?: string;
    price?: number;
    duration?: string;
  }>;
  currency: string;
}

export interface IMetrics {
  totalClients: number;
  averageRating: number;
  totalReviews: number;
  responseTime: number;
}

export interface ISettings {
  emailNotifications: {
    newClientAssignment: boolean;
    clientMessages: boolean;
    appointmentReminders: boolean;
    weeklyReports: boolean;
  };
  autoAssignment: {
    enabled: boolean;
    maxNewClientsPerWeek: number;
  };
}

export interface IProviderDocument extends Document {
  userId: mongoose.Types.ObjectId;
  professionalInfo: IProfessionalInfo;
  contactInfo: IContactInfo;
  serviceAreas: string[];
  services: Array<
    | 'prenatal_support'
    | 'birth_support'
    | 'postpartum_support'
    | 'overnight_care'
    | 'meal_preparation'
    | 'sibling_care'
    | 'household_assistance'
    | 'breastfeeding_support'
    | 'sleep_training'
    | 'infant_care_education'
  >;
  availability: IAvailability;
  clients: IClientAssignment[];
  pricing?: IPricing;
  status: 'active' | 'inactive' | 'pending_approval' | 'suspended';
  metrics: IMetrics;
  settings: ISettings;

  // Virtual properties
  readonly currentClientCount: number;
  readonly availabilityStatus: 'not_accepting' | 'full' | 'available';
  readonly displayName: string;

  // Instance methods
  addClient(clientId: mongoose.Types.ObjectId, serviceType?: string): this;
  updateClientStatus(clientId: mongoose.Types.ObjectId, status: string): this;
  canAcceptNewClient(): boolean;
}

export interface IProviderModel extends Model<IProviderDocument> {
  findAvailableInArea(serviceArea: string): Promise<IProviderDocument[]>;
  findBySpecialty(specialty: string): Promise<IProviderDocument[]>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Provider:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated provider profile ID
 *         userId:
 *           type: string
 *           description: Reference to the User document
 *         professionalInfo:
 *           type: object
 *           properties:
 *             certifications:
 *               type: array
 *               items:
 *                 type: string
 *             yearsExperience:
 *               type: number
 *             specialties:
 *               type: array
 *               items:
 *                 type: string
 *             bio:
 *               type: string
 *             education:
 *               type: array
 *               items:
 *                 type: object
 *         contactInfo:
 *           type: object
 *           properties:
 *             businessPhone:
 *               type: string
 *             businessEmail:
 *               type: string
 *             website:
 *               type: string
 *         serviceAreas:
 *           type: array
 *           items:
 *             type: string
 *         availability:
 *           type: object
 *           properties:
 *             isAcceptingClients:
 *               type: boolean
 *             maxClients:
 *               type: number
 *             schedule:
 *               type: object
 *         clients:
 *           type: array
 *           items:
 *             type: string
 *             description: Array of client User IDs
 */

const providerSchema = new Schema<IProviderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },

    // Professional Information
    professionalInfo: {
      certifications: [
        {
          type: String,
          enum: [
            'DONA_Birth_Doula',
            'DONA_Postpartum_Doula',
            'CAPPA_Birth_Doula',
            'CAPPA_Postpartum_Doula',
            'ToLabor_Birth_Doula',
            'ProDoula_Birth_Doula',
            'ProDoula_Postpartum_Doula',
            'Independent_Training',
            'Lactation_Consultant_IBCLC',
            'Childbirth_Educator',
            'Prenatal_Yoga_Instructor',
            'Infant_Massage_Instructor',
            'Other',
          ],
        },
      ],
      yearsExperience: {
        type: Number,
        min: 0,
        max: 50,
      },
      specialties: [
        {
          type: String,
          enum: [
            'first_time_parents',
            'high_risk_pregnancies',
            'cesarean_recovery',
            'vbac_support',
            'multiples_twins',
            'breastfeeding_support',
            'postpartum_depression',
            'infant_sleep_guidance',
            'newborn_care',
            'sibling_preparation',
            'loss_and_grief',
            'lgbtq_families',
            'teen_mothers',
            'military_families',
          ],
        },
      ],
      bio: {
        type: String,
        maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      },
      education: [
        {
          institution: String,
          degree: String,
          year: Number,
          relevantToDoula: Boolean,
        },
      ],
      languages: [
        {
          type: String,
          default: ['english'],
        },
      ],
    },

    // Contact Information
    contactInfo: {
      businessPhone: {
        type: String,
        match: [/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'],
      },
      businessEmail: {
        type: String,
        validate: {
          validator: (value: string) => validator.isEmail(value || ''),
          message: 'Please enter a valid email',
        },
      },
      website: {
        type: String,
        match: [/^https?:\/\/.+/, 'Please enter a valid website URL'],
      },
      socialMedia: {
        instagram: String,
        facebook: String,
        linkedin: String,
      },
    },

    // Service Information
    // Default to an empty list for initial provider registration; details can be filled in later.
    serviceAreas: {
      type: [String], // Cities, zip codes, or regions they serve
      default: [],
    },

    services: [
      {
        type: String,
        enum: [
          'prenatal_support',
          'birth_support',
          'postpartum_support',
          'overnight_care',
          'meal_preparation',
          'sibling_care',
          'household_assistance',
          'breastfeeding_support',
          'sleep_training',
          'infant_care_education',
        ],
      },
    ],

    // Availability Management
    availability: {
      isAcceptingClients: {
        type: Boolean,
        default: true,
      },
      maxClients: {
        type: Number,
        default: 8,
        min: 1,
        max: 20,
      },
      schedule: {
        monday: { available: Boolean, hours: String },
        tuesday: { available: Boolean, hours: String },
        wednesday: { available: Boolean, hours: String },
        thursday: { available: Boolean, hours: String },
        friday: { available: Boolean, hours: String },
        saturday: { available: Boolean, hours: String },
        sunday: { available: Boolean, hours: String },
      },
      holidaysOff: [Date],
      vacationDates: [
        {
          startDate: Date,
          endDate: Date,
          reason: String,
        },
      ],
    },

    // Client Management
    clients: [
      {
        clientId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'paused', 'transferred'],
          default: 'active',
        },
        serviceType: {
          type: String,
          enum: ['prenatal', 'birth', 'postpartum', 'comprehensive'],
        },
      },
    ],

    // Pricing Information (optional)
    pricing: {
      hourlyRate: Number,
      packageRates: [
        {
          packageName: String,
          description: String,
          price: Number,
          duration: String, // e.g., "4 weeks", "2 months"
        },
      ],
      currency: {
        type: String,
        default: 'USD',
      },
    },

    // Professional Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending_approval', 'suspended'],
      default: 'pending_approval',
    },

    // Performance Metrics
    metrics: {
      totalClients: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
      responseTime: {
        type: Number, // Average response time in hours
        default: 24,
      },
    },

    // Account Settings
    settings: {
      emailNotifications: {
        newClientAssignment: { type: Boolean, default: true },
        clientMessages: { type: Boolean, default: true },
        appointmentReminders: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: false },
      },
      autoAssignment: {
        enabled: { type: Boolean, default: false },
        maxNewClientsPerWeek: { type: Number, default: 2 },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for current client count
providerSchema.virtual('currentClientCount').get(function (this: IProviderDocument): number {
  return this.clients.filter(client => client.status === 'active').length;
});

// Virtual for availability status
providerSchema.virtual('availabilityStatus').get(function (
  this: IProviderDocument
): 'not_accepting' | 'full' | 'available' {
  if (!this.availability.isAcceptingClients) return 'not_accepting';
  if (this.currentClientCount >= this.availability.maxClients) return 'full';
  return 'available';
});

// Virtual for full professional name
providerSchema.virtual('displayName').get(function (this: IProviderDocument): string {
  return `${this.professionalInfo.certifications.join(', ')} Certified Doula`;
});

// Pre-save middleware to update metrics
providerSchema.pre<IProviderDocument>('save', function (next) {
  // Update total clients count
  this.metrics.totalClients = this.clients.length;

  // Update availability based on client load
  if (this.currentClientCount >= this.availability.maxClients) {
    this.availability.isAcceptingClients = false;
  }

  next();
});

// Instance method to add client
providerSchema.methods.addClient = function (
  this: IProviderDocument,
  clientId: mongoose.Types.ObjectId,
  serviceType: string = 'postpartum'
): IProviderDocument {
  // Check if client already exists
  const existingClient = this.clients.find(
    client => client.clientId.toString() === clientId.toString()
  );

  if (existingClient) {
    throw new Error('Client already assigned to this provider');
  }

  // Check availability
  if (
    !this.availability.isAcceptingClients ||
    this.currentClientCount >= this.availability.maxClients
  ) {
    throw new Error('Provider is not accepting new clients');
  }

  this.clients.push({
    clientId,
    serviceType: serviceType as 'prenatal' | 'birth' | 'postpartum' | 'comprehensive',
    status: 'active',
    assignedDate: new Date(),
  });

  return this;
};

// Instance method to remove/complete client
providerSchema.methods.updateClientStatus = function (
  this: IProviderDocument,
  clientId: mongoose.Types.ObjectId,
  status: string
): IProviderDocument {
  const client = this.clients.find(client => client.clientId.toString() === clientId.toString());

  if (!client) {
    throw new Error('Client not found');
  }

  client.status = status as 'active' | 'completed' | 'paused' | 'transferred';

  // If completing client, may open up availability
  if (status === 'completed' && this.currentClientCount < this.availability.maxClients) {
    this.availability.isAcceptingClients = true;
  }

  return this;
};

// Instance method to check if can accept new client
providerSchema.methods.canAcceptNewClient = function (this: IProviderDocument): boolean {
  return (
    this.availability.isAcceptingClients &&
    this.currentClientCount < this.availability.maxClients &&
    this.status === 'active'
  );
};

// Static method to find available providers in area
providerSchema.statics.findAvailableInArea = function (serviceArea: string) {
  return this.find({
    serviceAreas: { $in: [serviceArea] },
    'availability.isAcceptingClients': true,
    status: 'active',
  }).populate('userId', 'firstName lastName email');
};

// Static method to find providers by specialty
providerSchema.statics.findBySpecialty = function (specialty: string) {
  return this.find({
    'professionalInfo.specialties': specialty,
    status: 'active',
  }).populate('userId', 'firstName lastName email');
};

// Indexes (userId is unique via schema and gets an index automatically)
providerSchema.index({ serviceAreas: 1 });
providerSchema.index({ 'professionalInfo.specialties': 1 });
providerSchema.index({ 'availability.isAcceptingClients': 1, status: 1 });
providerSchema.index({ 'clients.clientId': 1 });
providerSchema.index({ createdAt: 1 });

const Provider = mongoose.model<IProviderDocument, IProviderModel>('Provider', providerSchema);

export default Provider;
