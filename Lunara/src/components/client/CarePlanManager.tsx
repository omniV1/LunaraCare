/**
 * @module components/client/CarePlanManager
 * Full-screen overlay for viewing, creating, and editing care plans.
 * Used by both providers (CRUD) and clients (read-only own plans).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';
import { CarePlanCard, type CarePlan, type CarePlanSection } from './CarePlanCard';

interface CarePlanManagerProps {
  /** Client document _id – used as display key only */
  clientId: string;
  /** User _id stored in CarePlan.clientId */
  clientUserId: string;
  clientName: string;
  onClose: () => void;
  /** When true, fetches via GET /care-plans/my and hides create plan UI (client viewing own plans) */
  isOwnView?: boolean;
}

interface CarePlanTemplate {
  _id: string;
  name: string;
  description?: string;
  sections?: CarePlanSection[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function unwrapCarePlan(res: unknown): CarePlan {
  if (isRecord(res) && 'carePlan' in res) {
    return (res as { carePlan: CarePlan }).carePlan;
  }
  return res as CarePlan;
}

/** Full-screen care plan manager with create, expand, edit, and status-update flows. */
export const CarePlanManager: React.FC<CarePlanManagerProps> = ({
  clientId: _clientId,
  clientUserId,
  clientName,
  onClose,
  isOwnView = false,
}) => {
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [templates, setTemplates] = useState<CarePlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', templateId: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState<string | null>(null);

  const api = ApiClient.getInstance();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const plansUrl = isOwnView ? '/care-plans/my' : `/care-plans/client/${clientUserId}`;
      const [plansRes, templatesRes] = await Promise.all([
        api.get<{ carePlans?: CarePlan[] } | CarePlan[]>(plansUrl),
        isOwnView ? Promise.resolve([] as CarePlanTemplate[]) : api.get<CarePlanTemplate[]>('/care-plans/templates'),
      ]);
      const plans = Array.isArray(plansRes) ? plansRes : plansRes.carePlans ?? [];
      const tmpl = Array.isArray(templatesRes) ? templatesRes : [];
      setCarePlans(plans);
      setTemplates(tmpl);
      if (plans.length > 0) {
        setExpandedPlanId(plans[0]._id);
      }
    } catch {
      toast.error('Failed to load care plans');
    } finally {
      setLoading(false);
    }
  }, [clientUserId, isOwnView]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        clientId: clientUserId,
        title: createForm.title.trim(),
      };
      if (createForm.description.trim()) body.description = createForm.description.trim();
      if (createForm.templateId) body.templateId = createForm.templateId;
      const res = await api.post<{ carePlan?: CarePlan } | CarePlan>('/care-plans', body);
      const newPlan = unwrapCarePlan(res);
      setCarePlans(prev => [newPlan, ...prev]);
      setExpandedPlanId(newPlan._id);
      setShowCreateForm(false);
      setCreateForm({ title: '', templateId: '', description: '' });
      toast.success('Care plan created');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : undefined;
      toast.error(message ?? 'Failed to create care plan');
    } finally {
      setCreating(false);
    }
  };

  const handleMilestoneUpdate = async (planId: string, milestoneId: string, status: string) => {
    setUpdatingMilestone(milestoneId);
    try {
      const res = await api.patch<{ carePlan?: CarePlan } | CarePlan>(
        `/care-plans/${planId}/milestone/${milestoneId}`,
        { status }
      );
      const updated = unwrapCarePlan(res);
      setCarePlans(prev => prev.map(p => (p._id === planId ? { ...p, ...updated } : p)));
    } catch {
      toast.error('Failed to update milestone');
    } finally {
      setUpdatingMilestone(null);
    }
  };

  const handlePlanStatusUpdate = async (planId: string, status: string) => {
    setUpdatingStatus(planId);
    try {
      const res = await api.put<{ carePlan?: CarePlan } | CarePlan>(`/care-plans/${planId}`, { status });
      const updated = unwrapCarePlan(res);
      setCarePlans(prev => prev.map(p => (p._id === planId ? { ...p, ...updated } : p)));
      toast.success('Plan status updated');
    } catch {
      toast.error('Failed to update plan status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSavePlanEdits = async (planId: string, draft: { title: string; description: string; sections: Array<{ _id?: string; title: string; description: string; milestones: Array<{ _id?: string; title: string; description: string; weekOffset: number; category: string; status: string; notes: string; completedAt?: string }> }> }) => {
    setSavingPlan(planId);
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        sections: draft.sections.map(s => ({
          ...(s._id && { _id: s._id }),
          title: s.title.trim(),
          description: (s.description ?? '').trim() || undefined,
          milestones: (s.milestones ?? []).map(m => ({
            ...(m._id && { _id: m._id }),
            title: m.title.trim(),
            description: (m.description ?? '').trim() || undefined,
            weekOffset: m.weekOffset ?? 0,
            category: m.category ?? 'general',
            status: m.status ?? 'pending',
            notes: (m.notes ?? '').trim() || undefined,
            completedAt: m.status === 'completed' ? (m.completedAt || new Date().toISOString()) : undefined,
          })),
        })),
      };
      const res = await api.put<{ carePlan?: CarePlan } | CarePlan>(`/care-plans/${planId}`, payload);
      const updated = unwrapCarePlan(res);
      setCarePlans(prev => prev.map(p => (p._id === planId ? { ...p, ...updated } : p)));
      toast.success('Care plan updated');
    } catch (e: unknown) {
      const message =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      toast.error(message ?? 'Failed to save');
    } finally {
      setSavingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-[#DED7CD] bg-white shadow-sm flex-shrink-0 min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold text-[#4E1B00] truncate">Care Plans</h2>
          <p className="text-sm text-[#6B4D37]/70 truncate">{clientName}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isOwnView && (
            <button
              type="button"
              onClick={() => { setShowCreateForm(v => !v); }}
              className="px-4 py-2 bg-[#6B4D37] text-white text-sm font-medium rounded-md hover:bg-[#5a402e] transition-colors"
            >
              {showCreateForm ? 'Cancel' : '+ New Care Plan'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#BCADA5] hover:text-[#6B4D37] rounded-md hover:bg-[#FAF7F2] transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Create Form (provider only) */}
      {!isOwnView && showCreateForm && (
        <div className="border-b border-[#DED7CD] bg-[#FAF7F2] px-6 py-5 flex-shrink-0">
          <h3 className="text-sm font-semibold text-[#4E1B00] mb-3">New Care Plan for {clientName}</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#6B4D37] mb-1">Title *</label>
              <input
                type="text"
                value={createForm.title}
                onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Postpartum Recovery Plan"
                className="w-full rounded-md border border-[#CAC3BC] px-3 py-2 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B4D37] mb-1">
                From Template <span className="font-normal text-[#BCADA5]">(optional)</span>
              </label>
              <select
                value={createForm.templateId}
                onChange={e => {
                  const t = templates.find(t => t._id === e.target.value);
                  setCreateForm(f => ({
                    ...f,
                    templateId: e.target.value,
                    title: f.title || (t?.name ?? ''),
                  }));
                }}
                className="w-full rounded-md border border-[#CAC3BC] px-3 py-2 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
              >
                <option value="">— Start blank —</option>
                {templates.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#6B4D37] mb-1">
                Description <span className="font-normal text-[#BCADA5]">(optional)</span>
              </label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Brief overview of this plan's goals…"
                className="w-full rounded-md border border-[#CAC3BC] px-3 py-2 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !createForm.title.trim()}
              className="px-4 py-2 bg-[#6B4D37] text-white text-sm font-medium rounded-md hover:bg-[#5a402e] disabled:opacity-50 transition-colors"
            >
              {creating ? 'Creating…' : 'Create Plan'}
            </button>
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); setCreateForm({ title: '', templateId: '', description: '' }); }}
              className="px-4 py-2 border border-[#CAC3BC] text-[#4E1B00]/80 text-sm font-medium rounded-md hover:bg-[#FAF7F2] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plans list */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-[#6B4D37]/70 text-sm">Loading care plans…</div>
          </div>
        ) : carePlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-12 h-12 text-[#BCADA5] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-[#6B4D37]/70 font-medium">No care plans yet</p>
            <p className="text-[#BCADA5] text-sm mt-1">
              {isOwnView ? 'Your provider has not added any care plans yet.' : `Create the first care plan for ${clientName}.`}
            </p>
            {!isOwnView && (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="mt-4 px-4 py-2 bg-[#6B4D37] text-white text-sm font-medium rounded-md hover:bg-[#5a402e] transition-colors"
              >
                + Create Care Plan
              </button>
            )}
          </div>
        ) : (
          carePlans.map(plan => (
            <CarePlanCard
              key={plan._id}
              plan={plan}
              isExpanded={expandedPlanId === plan._id}
              onToggleExpand={() => setExpandedPlanId(expandedPlanId === plan._id ? null : plan._id)}
              onMilestoneUpdate={handleMilestoneUpdate}
              onPlanStatusUpdate={handlePlanStatusUpdate}
              onSavePlanEdits={handleSavePlanEdits}
              updatingMilestone={updatingMilestone}
              updatingStatus={updatingStatus}
              savingPlan={savingPlan}
            />
          ))
        )}
      </div>
    </div>
  );
};
