import React, { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

const MILESTONE_STATUSES = ['pending', 'in_progress', 'completed', 'skipped'] as const;
type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

const STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  skipped: 'Skipped',
};

const STATUS_COLORS: Record<MilestoneStatus, string> = {
  pending: 'bg-[#FAF7F2] text-[#4E1B00]/80',
  in_progress: 'bg-[#DED7CD]/50 text-[#6B4D37]',
  completed: 'bg-[#8C9A8C]/20 text-[#3F4E4F]',
  skipped: 'bg-amber-100 text-amber-700',
};

const CATEGORY_COLORS: Record<string, string> = {
  physical: 'bg-red-100 text-red-700',
  emotional: 'bg-purple-100 text-purple-700',
  feeding: 'bg-[#AA6641]/20 text-[#AA6641]',
  self_care: 'bg-teal-100 text-teal-700',
  general: 'bg-[#FAF7F2] text-[#6B4D37]',
};

const PLAN_STATUS_COLORS: Record<string, string> = {
  active: 'bg-[#8C9A8C]/20 text-[#3F4E4F]',
  completed: 'bg-[#DED7CD]/50 text-[#6B4D37]',
  paused: 'bg-amber-100 text-amber-700',
  archived: 'bg-[#FAF7F2] text-[#6B4D37]',
};

export interface CarePlanMilestone {
  _id: string;
  title?: string;
  description?: string;
  weekOffset?: number;
  category?: string;
  status?: MilestoneStatus;
  completedAt?: string;
  notes?: string;
}

export interface CarePlanSection {
  _id?: string;
  title?: string;
  description?: string;
  milestones?: CarePlanMilestone[];
}

export interface CarePlan {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  sections?: CarePlanSection[];
}

interface CarePlanMilestoneDraft {
  _id?: string;
  title: string;
  description: string;
  weekOffset: number;
  category: string;
  status: MilestoneStatus;
  completedAt?: string;
  notes: string;
}

interface CarePlanSectionDraft {
  _id?: string;
  title: string;
  description: string;
  milestones: CarePlanMilestoneDraft[];
}

interface CarePlanDraft {
  title: string;
  description: string;
  sections: CarePlanSectionDraft[];
}

// ── Props ──────────────────────────────────────────────────────────────────

interface CarePlanCardProps {
  plan: CarePlan;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onMilestoneUpdate: (planId: string, milestoneId: string, status: MilestoneStatus) => Promise<void>;
  onPlanStatusUpdate: (planId: string, status: string) => Promise<void>;
  onSavePlanEdits: (planId: string, draft: CarePlanDraft) => Promise<void>;
  updatingMilestone: string | null;
  updatingStatus: string | null;
  savingPlan: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function progressBarColor(pct: number) {
  if (pct >= 75) return 'bg-[#3F4E4F]';
  if (pct >= 40) return 'bg-[#6B4D37]';
  return 'bg-amber-500';
}

function deepCloneSections(sections: CarePlanSection[]): CarePlanSectionDraft[] {
  return sections.map(s => ({
    _id: s._id,
    title: s.title ?? '',
    description: s.description ?? '',
    milestones: (s.milestones ?? []).map((m): CarePlanMilestoneDraft => ({
      _id: m._id,
      title: m.title ?? '',
      description: m.description ?? '',
      weekOffset: m.weekOffset ?? 0,
      category: m.category ?? 'general',
      status: (m.status ?? 'pending') as MilestoneStatus,
      completedAt: m.completedAt,
      notes: m.notes ?? '',
    })),
  }));
}

// ── Component ──────────────────────────────────────────────────────────────

export const CarePlanCard: React.FC<CarePlanCardProps> = ({
  plan,
  isExpanded,
  onToggleExpand,
  onMilestoneUpdate,
  onPlanStatusUpdate,
  onSavePlanEdits,
  updatingMilestone,
  updatingStatus,
  savingPlan,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingDraft, setEditingDraft] = useState<CarePlanDraft | null>(null);

  const progress = plan.progress ?? 0;
  const allMilestones = (plan.sections ?? []).flatMap(s => s.milestones ?? []);
  const completedCount = allMilestones.filter(m => m.status === 'completed').length;

  const startEditing = () => {
    setIsEditing(true);
    setEditingDraft({
      title: plan.title ?? '',
      description: plan.description ?? '',
      sections: deepCloneSections(plan.sections ?? []),
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingDraft(null);
  };

  const addSection = () => {
    if (!editingDraft) return;
    setEditingDraft({
      ...editingDraft,
      sections: [...editingDraft.sections, { title: 'New section', description: '', milestones: [] }],
    });
  };

  const addMilestone = (sectionIndex: number) => {
    if (!editingDraft) return;
    const next = editingDraft.sections.slice();
    const section = next[sectionIndex];
    if (!section) return;
    next[sectionIndex] = {
      ...section,
      milestones: [...(section.milestones || []), { title: 'New milestone', description: '', weekOffset: 0, category: 'general', status: 'pending', notes: '' }],
    };
    setEditingDraft({ ...editingDraft, sections: next });
  };

  const updateDraftSection = (sectionIndex: number, field: 'title' | 'description', value: string) => {
    if (!editingDraft) return;
    const next = editingDraft.sections.slice();
    next[sectionIndex] = { ...next[sectionIndex], [field]: value };
    setEditingDraft({ ...editingDraft, sections: next });
  };

  const updateDraftMilestone = <K extends keyof CarePlanMilestoneDraft>(
    sectionIndex: number,
    milestoneIndex: number,
    field: K,
    value: CarePlanMilestoneDraft[K]
  ) => {
    if (!editingDraft) return;
    const next = editingDraft.sections.slice();
    const section = next[sectionIndex];
    if (!section) return;
    const milestones = (section.milestones ?? []).slice();
    milestones[milestoneIndex] = { ...milestones[milestoneIndex], [field]: value };
    next[sectionIndex] = { ...section, milestones };
    setEditingDraft({ ...editingDraft, sections: next });
  };

  const handleSave = async () => {
    if (!editingDraft) return;
    await onSavePlanEdits(plan._id, editingDraft);
    setIsEditing(false);
    setEditingDraft(null);
  };

  return (
    <div className="border border-[#DED7CD] rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Plan header – clickable to expand */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#FAF7F2] transition-colors"
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#4E1B00]">{plan.title}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_STATUS_COLORS[plan.status ?? 'active'] ?? 'bg-[#FAF7F2] text-[#6B4D37]'}`}>
              {plan.status ?? 'active'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-[#DED7CD] rounded-full h-1.5 max-w-xs">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${progressBarColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-[#6B4D37]/70 whitespace-nowrap">
              {completedCount}/{allMilestones.length} · {Math.round(progress)}%
            </span>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[#BCADA5] flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Plan body */}
      {isExpanded && (
        <div className="border-t border-[#DED7CD] px-5 py-4">
          {isEditing && editingDraft ? (
            /* Edit mode */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B4D37] mb-1">Plan title</label>
                <input
                  type="text"
                  value={editingDraft.title}
                  onChange={e => setEditingDraft({ ...editingDraft, title: e.target.value })}
                  className="w-full rounded border border-[#CAC3BC] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B4D37] mb-1">Description (optional)</label>
                <textarea
                  value={editingDraft.description}
                  onChange={e => setEditingDraft({ ...editingDraft, description: e.target.value })}
                  rows={2}
                  className="w-full rounded border border-[#CAC3BC] px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-4">
                {editingDraft.sections.map((section, si: number) => (
                  <div key={si} className="rounded-lg border border-[#DED7CD] bg-[#FAF7F2] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={section.title}
                        onChange={e => updateDraftSection(si, 'title', e.target.value)}
                        className="flex-1 rounded border border-[#CAC3BC] px-3 py-1.5 text-sm font-medium"
                        placeholder="Section title"
                      />
                    </div>
                    <input
                      type="text"
                      value={section.description ?? ''}
                      onChange={e => updateDraftSection(si, 'description', e.target.value)}
                      className="w-full rounded border border-[#CAC3BC] px-3 py-1 text-sm mb-3"
                      placeholder="Section description (optional)"
                    />
                    <ul className="space-y-2">
                      {(section.milestones ?? []).map((m, mi: number) => (
                        <li key={mi} className="flex flex-wrap gap-2 items-start p-2 rounded bg-white border border-[#DED7CD]">
                          <input
                            type="text"
                            value={m.title}
                            onChange={e => updateDraftMilestone(si, mi, 'title', e.target.value)}
                            className="flex-1 min-w-[120px] rounded border border-[#CAC3BC] px-2 py-1 text-sm"
                            placeholder="Milestone title"
                          />
                          <input
                            type="text"
                            value={m.description ?? ''}
                            onChange={e => updateDraftMilestone(si, mi, 'description', e.target.value)}
                            className="flex-1 min-w-[120px] rounded border border-[#CAC3BC] px-2 py-1 text-xs"
                            placeholder="Description (optional)"
                          />
                          <input
                            type="text"
                            value={m.notes ?? ''}
                            onChange={e => updateDraftMilestone(si, mi, 'notes', e.target.value)}
                            className="flex-1 min-w-[120px] rounded border border-[#CAC3BC] px-2 py-1 text-xs"
                            placeholder="Notes (optional)"
                          />
                          <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={m.status === 'completed'}
                              onChange={e => updateDraftMilestone(si, mi, 'status', e.target.checked ? 'completed' : 'pending')}
                            />
                            Done
                          </label>
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => addMilestone(si)} className="mt-2 text-xs text-[#6B4D37] hover:text-[#4E1B00] font-medium">+ Add milestone</button>
                  </div>
                ))}
                <button type="button" onClick={addSection} className="w-full py-2 border border-dashed border-[#CAC3BC] rounded text-sm text-[#6B4D37] hover:bg-[#FAF7F2]">+ Add section</button>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={handleSave} disabled={savingPlan === plan._id} className="px-4 py-2 bg-[#6B4D37] text-white text-sm rounded-md hover:bg-[#5a402e] disabled:opacity-50">{savingPlan === plan._id ? 'Saving…' : 'Save changes'}</button>
                <button type="button" onClick={cancelEditing} className="px-4 py-2 border border-[#CAC3BC] text-[#4E1B00]/80 text-sm rounded-md hover:bg-[#FAF7F2]">Cancel</button>
              </div>
            </div>
          ) : (
            /* View mode */
            <>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                {plan.description && <p className="text-sm text-[#6B4D37]">{plan.description}</p>}
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <button type="button" onClick={startEditing} className="text-xs px-3 py-1.5 border border-[#CAC3BC] rounded text-[#4E1B00]/80 hover:bg-[#FAF7F2]">Edit plan</button>
                  <span className="text-xs text-[#6B4D37]/70">Status:</span>
                  <select
                    value={plan.status}
                    disabled={updatingStatus === plan._id}
                    onChange={e => onPlanStatusUpdate(plan._id, e.target.value)}
                    className="text-xs border border-[#CAC3BC] rounded px-2 py-1 focus:ring-[#6B4D37] focus:border-[#6B4D37] disabled:opacity-50"
                  >
                    {['active', 'paused', 'completed', 'archived'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(plan.sections ?? []).length === 0 ? (
                <p className="text-sm text-[#BCADA5] italic mb-2">No sections yet.</p>
              ) : (
                <div className="space-y-5">
                  {(plan.sections ?? []).map((section, si: number) => (
                    <div key={si}>
                      <h4 className="text-sm font-semibold text-[#4E1B00] mb-1">{section.title}</h4>
                      {section.description && <p className="text-xs text-[#6B4D37]/70 mb-2">{section.description}</p>}
                      <ul className="space-y-2">
                        {(section.milestones ?? []).map(m => (
                          <li key={m._id} className="flex items-start gap-3 p-3 rounded-md bg-[#FAF7F2] border border-[#DED7CD]">
                            <label className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                              <input
                                type="checkbox"
                                checked={m.status === 'completed'}
                                disabled={updatingMilestone === m._id}
                                onChange={() => onMilestoneUpdate(plan._id, m._id, m.status === 'completed' ? 'pending' : 'completed')}
                                className="rounded border-[#CAC3BC] text-[#3F4E4F] focus:ring-[#3F4E4F]"
                              />
                              <span className="sr-only">Mark done</span>
                            </label>
                            <div className={`flex-1 min-w-0 ${m.status === 'completed' ? 'opacity-75' : ''}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium text-[#4E1B00] ${m.status === 'completed' ? 'line-through' : ''}`}>{m.title}</span>
                                {m.category && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[m.category] ?? 'bg-[#FAF7F2] text-[#6B4D37]'}`}>{m.category.replace('_', ' ')}</span>
                                )}
                                {(m.weekOffset ?? 0) > 0 && (
                                  <span className="text-xs text-[#BCADA5]">Week {m.weekOffset}</span>
                                )}
                              </div>
                              {m.description && <p className="text-xs text-[#6B4D37]/70 mt-0.5">{m.description}</p>}
                              {m.notes && <p className="text-xs text-[#6B4D37] mt-1 italic">Note: {m.notes}</p>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0 flex-wrap justify-end">
                              {MILESTONE_STATUSES.map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={updatingMilestone === m._id}
                                  onClick={() => onMilestoneUpdate(plan._id, m._id, s)}
                                  className={`text-xs px-2 py-1 rounded font-medium transition-colors ${m.status === s ? STATUS_COLORS[s] + ' ring-1 ring-inset ring-current' : 'bg-white border border-[#DED7CD] text-[#6B4D37]/70 hover:bg-[#FAF7F2]'} disabled:opacity-40`}
                                >
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
              {(plan.sections ?? []).length === 0 && (
                <button type="button" onClick={startEditing} className="mt-2 text-sm text-[#6B4D37] hover:text-[#4E1B00] font-medium">Edit plan to add sections & milestones</button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
