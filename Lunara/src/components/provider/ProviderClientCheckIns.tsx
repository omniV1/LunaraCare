/**
 * @module components/provider/ProviderClientCheckIns
 * Modal overlay showing a selected client's recent check-in history,
 * 30-day trend summary, and clinical alerts for the provider to review.
 */
import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../api/apiClient';
import { toast } from 'react-toastify';

type PhysicalSymptom =
  | 'fatigue'
  | 'sleep_issues'
  | 'appetite_changes'
  | 'anxiety'
  | 'pain'
  | 'headache'
  | 'nausea'
  | 'dizziness'
  | 'breast_soreness'
  | 'bleeding';

interface CheckIn {
  _id: string;
  date: string;
  moodScore: number;
  physicalSymptoms: PhysicalSymptom[];
  notes?: string;
  sharedWithProvider: boolean;
}

interface TrendData {
  period: string;
  averageMood: number;
  checkInCount: number;
  moodByDay: Array<{ date: string; moodScore: number }>;
  symptomFrequency: Record<string, number>;
  moodTrend: 'improving' | 'stable' | 'declining';
}

interface AlertInfo {
  type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

interface ProviderClientCheckInsProps {
  clientUserId: string;
  clientName: string;
  onClose: () => void;
}

/** Modal displaying a client's check-in history, mood trends, and alerts. */
export const ProviderClientCheckIns: React.FC<ProviderClientCheckInsProps> = ({
  clientUserId,
  clientName,
  onClose,
}) => {
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const api = ApiClient.getInstance();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!clientUserId) return;
      setLoading(true);
      try {
        const [historyRes, trendsRes] = await Promise.all([
          api.get<CheckIn[] | { checkIns?: CheckIn[]; count?: number }>(
            `/checkins/user/${clientUserId}?limit=30`
          ),
          api.get<{ trends?: TrendData; alerts?: AlertInfo[] }>(`/checkins/trends/${clientUserId}?days=30`),
        ]);
        if (cancelled) return;
        const historyData = Array.isArray(historyRes) ? historyRes : historyRes.checkIns ?? [];
        setHistory(Array.isArray(historyData) ? historyData : []);
        const t = trendsRes.trends;
        const a = trendsRes.alerts ?? [];
        if (t && typeof t === 'object') setTrends(t as TrendData);
        setAlerts(Array.isArray(a) ? (a as AlertInfo[]) : []);
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
            : err instanceof Error
              ? err.message
              : undefined;
        toast.error(
          message ?? 'Unable to load this client\u2019s check-ins right now. Please try again shortly.'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientUserId]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const moodLabel = (score: number) => {
    if (score <= 3) return 'Very heavy day';
    if (score <= 6) return 'Mixed / tender day';
    return 'Lighter day';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-[#6B4D37] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" aria-hidden onClick={onClose} />
        <div className="relative bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto overflow-x-hidden" style={{ maxHeight: '90dvh', WebkitOverflowScrolling: 'touch' }}>
          <div className="sticky top-0 bg-dash-card border-b border-dash-section-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-dash-text-primary truncate">
                Daily check-ins — {clientName}
              </h2>
              <p className="text-xs sm:text-sm text-dash-text-secondary/80 mt-0.5">
                A snapshot of how this person has been doing in their body and emotions—whether
                they&apos;re home with a baby, still pregnant, or moving through postpartum after
                loss.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-dash-text-secondary/60 hover:text-dash-text-secondary p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {alerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 space-y-2">
                <p className="text-xs sm:text-sm font-medium text-amber-900">
                  Signals from recent check-ins
                </p>
                <div className="flex flex-wrap gap-2">
                  {alerts.map((alert, idx) => (
                    <span
                      key={`${alert.type}-${idx}`}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] ${
                        alert.severity === 'critical'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : alert.severity === 'warning'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-[#6B4D37]/5 text-[#4E1B00] border border-[#6B4D37]/20'
                      }`}
                    >
                      {alert.message}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-[#EDE8E0]/30 rounded-lg border border-dash-section-border p-3 sm:p-4 space-y-2">
                <p className="text-xs font-medium text-dash-text-secondary/60 uppercase tracking-wide">
                  30-day snapshot
                </p>
                {trends ? (
                  <div className="space-y-2">
                    <p className="text-sm text-dash-text-secondary">
                      Average mood:{' '}
                      <span className="font-semibold text-dash-text-primary">
                        {trends.averageMood.toFixed(1)}
                      </span>{' '}
                      <span className="text-xs text-dash-text-secondary/60">
                        ({trends.checkInCount} check-in
                        {trends.checkInCount === 1 ? '' : 's'})
                      </span>
                    </p>
                    <p className="text-sm text-dash-text-secondary">
                      Trend:{' '}
                      <span className="font-semibold text-dash-text-primary capitalize">
                        {trends.moodTrend}
                      </span>
                    </p>
                    {Object.keys(trends.symptomFrequency).length > 0 && (
                      <p className="text-xs text-dash-text-secondary/80">
                        Most mentioned symptoms include{' '}
                        {Object.entries(trends.symptomFrequency)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 3)
                          .map(([symptom, count], index, arr) => (
                            <span key={symptom}>
                              {index > 0 && index === arr.length - 1 ? ' and ' : index > 0 ? ', ' : ''}
                              <span className="font-medium">{symptom.replace(/_/g, ' ')}</span> (
                              {count})
                            </span>
                          ))}
                        .
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-dash-text-secondary/60">
                    Not enough check-ins yet to summarize trends for this season.
                  </p>
                )}
              </div>

              <div className="lg:col-span-2 bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-dash-text-primary">Recent check-ins</p>
                  <p className="text-xs text-dash-text-secondary/60">
                    Last {Math.min(history.length, 30)} entries
                  </p>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-dash-text-secondary/60">
                    There are no check-ins on record yet. When they begin tracking — whether around
                    feeding, sleep, mood, pregnancy, or grief — those entries will appear here.
                  </p>
                ) : (
                  <ul className="divide-y divide-dash-section-border max-h-80 overflow-y-auto">
                    {history.map(checkIn => (
                      <li key={checkIn._id} className="py-2.5 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-dash-text-secondary">
                              {formatDate(checkIn.date)}{' '}
                              <span className="text-dash-text-secondary/40">·</span>{' '}
                              <span className="text-dash-text-secondary/80">
                                Mood {checkIn.moodScore}{' '}
                                <span className="text-dash-text-secondary/60">({moodLabel(checkIn.moodScore)})</span>
                              </span>
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              checkIn.sharedWithProvider
                                ? 'bg-[#6B4D37]/5 text-[#4E1B00] border border-[#6B4D37]/20'
                                : 'bg-[#EDE8E0]/30 text-dash-text-secondary/60 border border-dash-section-border'
                            }`}
                          >
                            {checkIn.sharedWithProvider ? 'Shared with you' : 'Kept private'}
                          </span>
                        </div>
                        {checkIn.physicalSymptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {checkIn.physicalSymptoms.map(symptom => (
                              <span
                                key={symptom}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-800 border border-purple-200"
                              >
                                {symptom.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        {checkIn.notes && (
                          <p className="text-xs text-dash-text-secondary whitespace-pre-wrap">
                            {checkIn.notes.length > 260
                              ? `${checkIn.notes.slice(0, 260)}…`
                              : checkIn.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

