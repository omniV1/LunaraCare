/**
 * @module components/documents/DocumentRecommendationsPanel
 * Displays AI-generated document suggestions based on the client's postpartum
 * week and intake data, with one-click template creation.
 */
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { documentService } from '../../services/documentService';
import { DocumentRecommendations, DocumentRecommendation } from '../../services/recommendationService';
import { ApiClient } from '../../api/apiClient';
import { RecommendationService } from '../../services/recommendationService';

type DocType =
  | 'emotional-survey'
  | 'health-assessment'
  | 'personal-assessment'
  | 'feeding-log'
  | 'sleep-log'
  | 'mood-check-in'
  | 'recovery-notes'
  | 'other';

type IntakeLike = Partial<{
  feedingGoals: string;
  feedingPreferences: string[];
  mentalHealthHistory: string;
  postpartumMoodConcerns: boolean;
  supportNeeds: string[];
  postpartumGoals: string[];
  partnerName: string;
  numberOfChildren: number;
  currentMedications: string[];
  allergies: string[];
}>;

/** Builds a human-readable intake summary string relevant to the given document type. */
function intakeSummaryForType(intake: IntakeLike | null, type: string): string {
  if (!intake) return '';
  const parts: string[] = [];
  if (type === 'feeding-log' && (intake.feedingGoals || intake.feedingPreferences?.length)) {
    if (intake.feedingGoals) parts.push(`Goals: ${intake.feedingGoals}`);
    if (intake.feedingPreferences?.length) parts.push(`Method(s): ${intake.feedingPreferences.join(', ')}`);
  }
  if (type === 'mood-check-in' && (intake.mentalHealthHistory || intake.postpartumMoodConcerns)) {
    if (intake.mentalHealthHistory) parts.push(intake.mentalHealthHistory);
    if (intake.postpartumMoodConcerns) parts.push('Noted mood/emotional concerns.');
  }
  if (type === 'recovery-notes' && (intake.supportNeeds?.length || intake.postpartumGoals?.length)) {
    if (intake.supportNeeds?.length) parts.push(`Support needs: ${intake.supportNeeds.join(', ')}`);
    if (intake.postpartumGoals?.length) parts.push(`Goals: ${intake.postpartumGoals.join(', ')}`);
  }
  if (type === 'personal-assessment' && (intake.partnerName || intake.numberOfChildren != null)) {
    if (intake.partnerName) parts.push(`Partner/support: ${intake.partnerName}`);
    if (intake.numberOfChildren != null) parts.push(`Number of children: ${intake.numberOfChildren}`);
  }
  if (type === 'health-assessment' && (intake.currentMedications?.length || intake.allergies?.length)) {
    if (intake.currentMedications?.length) parts.push(`Medications: ${intake.currentMedications.join(', ')}`);
    if (intake.allergies?.length) parts.push(`Allergies: ${intake.allergies.join(', ')}`);
  }
  return parts.length ? parts.join(' | ') : '';
}

function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-[#DED7CD]/50 text-[#4E1B00] border-[#DED7CD]';
    default:
      return 'bg-[#FAF7F2] text-[#4E1B00] border-[#DED7CD]';
  }
}

function getPriorityBadgeClass(priority: 'high' | 'medium' | 'low'): string {
  if (priority === 'high') return 'px-2 py-1 text-xs rounded-full bg-red-100 text-red-800';
  if (priority === 'medium') return 'px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800';
  return 'px-2 py-1 text-xs rounded-full bg-[#DED7CD]/50 text-[#4E1B00]';
}

/** Props for the document recommendations panel (exported variant). */
export interface DocumentRecommendationsPanelProps {
  recommendations: DocumentRecommendations;
  isClient: boolean;
  userRole?: string;
  onDocumentCreated: () => void;
  onRecommendationsRefreshed: (recs: DocumentRecommendations) => void;
}

/** Renders postpartum-week-based document suggestion cards with template creation. */
export const DocumentRecommendationsPanel: React.FC<DocumentRecommendationsPanelProps> = ({
  recommendations,
  isClient,
  userRole,
  onDocumentCreated,
  onRecommendationsRefreshed,
}) => {
  const [creatingTemplateType, setCreatingTemplateType] = useState<string | null>(null);

  const handleCreateTemplate = async (suggestion: DocumentRecommendation) => {
    setCreatingTemplateType(suggestion.type);
    try {
      let notes = suggestion.description;
      try {
        const intakeRes = await ApiClient.getInstance().get<{ intake?: IntakeLike }>('/intake/me');
        const summary = intakeSummaryForType(intakeRes?.intake ?? null, suggestion.type);
        if (summary) notes += `\n\nFrom your intake: ${summary}`;
      } catch {
        // Intake optional for template
      }
      await documentService.createDocument({
        title: suggestion.title,
        documentType: suggestion.type as DocType,
        files: [],
        notes,
        privacyLevel: 'client-and-provider',
      });
      toast.success(`"${suggestion.title}" created. Add a file via Upload or edit this draft.`);
      onDocumentCreated();
      // Refresh recommendations so this suggestion can disappear if desired
      if (isClient && userRole === 'client') {
        RecommendationService.getInstance()
          .getDocumentRecommendations()
          .then(onRecommendationsRefreshed)
          .catch(() => {});
      }
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : undefined;
      toast.error(message ?? 'Failed to create template document');
    } finally {
      setCreatingTemplateType(null);
    }
  };

  if (recommendations.suggestions.length === 0) return null;

  return (
    <div className="bg-[#FAF7F2] border border-[#DED7CD] rounded-lg shadow-sm p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#4E1B00]">Suggested Documents</h3>
            <p className="text-sm text-[#4E1B00] mt-1">
              Based on your postpartum week (Week {recommendations.postpartumWeek})
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${index}`}
              className={`bg-white rounded-lg p-4 border-2 ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-[#4E1B00]">{suggestion.title}</h4>
                <span className={getPriorityBadgeClass(suggestion.priority)}>
                  {suggestion.priority}
                </span>
              </div>
              <p className="text-sm text-[#6B4D37] mb-2">{suggestion.description}</p>
              <p className="text-xs text-[#6B4D37]/70 mb-3">{suggestion.reason}</p>
              <button
                type="button"
                disabled={creatingTemplateType === suggestion.type}
                onClick={() => handleCreateTemplate(suggestion)}
                className="w-full px-3 py-2 bg-[#6B4D37] text-white text-sm rounded-md hover:bg-[#5a402e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingTemplateType === suggestion.type ? 'Creating\u2026' : 'Create Document'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
