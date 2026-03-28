export type PreferredContactMethod = 'phone' | 'text' | 'email' | 'app';

export type BirthType = 'vaginal' | 'cesarean' | 'vbac';
export type BirthLocation = 'hospital' | 'birth_center' | 'home';

export interface IntakeData {
  partnerName?: string;
  partnerPhone?: string;
  address?: { street?: string; city?: string; state?: string; zipCode?: string };
  emergencyContact?: { name?: string; phone?: string; relationship?: string };

  communicationPreferences?: {
    preferredContactMethod?: PreferredContactMethod;
    bestTimeToContact?: string;
    languagePreference?: string;
  };

  // Pregnancy & birth
  isFirstBaby?: boolean;
  numberOfChildren?: number;
  currentPregnancyComplications?: string[];
  birthExperience?: {
    birthType?: BirthType;
    birthLocation?: BirthLocation;
    laborDuration?: number;
  };

  // Feeding
  feedingPreferences?: string[];
  feedingChallenges?: string[];
  feedingGoals?: string;

  // Support
  supportNeeds?: string[];
  additionalSupportNeeds?: string;
  postpartumGoals?: string[];
  concernsOrFears?: string[];
  expectations?: string;
  previousDoulaExperience?: boolean;

  // Health
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
  mentalHealthHistory?: string;
  postpartumMoodConcerns?: boolean;
}

export const SUPPORT_OPTIONS = [
  { value: 'breastfeeding_support', label: 'Breastfeeding support' },
  { value: 'newborn_care', label: 'Newborn care' },
  { value: 'emotional_support', label: 'Emotional support' },
  { value: 'postpartum_recovery', label: 'Postpartum recovery' },
  { value: 'sleep_guidance', label: 'Sleep guidance' },
  { value: 'meal_preparation', label: 'Meal preparation' },
  { value: 'household_help', label: 'Household help' },
  { value: 'partner_support', label: 'Partner support' },
  { value: 'sibling_adjustment', label: 'Sibling adjustment' },
  { value: 'return_to_work', label: 'Return to work' },
] as const;

export const FEEDING_OPTIONS = [
  { value: 'breastfeeding', label: 'Breastfeeding' },
  { value: 'formula', label: 'Formula' },
  { value: 'combination', label: 'Combination' },
  { value: 'pumping', label: 'Pumping' },
] as const;

