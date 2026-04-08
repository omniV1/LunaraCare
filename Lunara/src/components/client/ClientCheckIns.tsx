/**
 * @module components/client/ClientCheckIns
 * Daily mood and physical-symptom check-in form with history and trend
 * summaries. Lets clients track wellbeing and optionally share with their provider.
 */
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';
import { useAuth } from '../../contexts/useAuth';

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

const SYMPTOMS: Array<{ id: PhysicalSymptom; label: string }> = [
  { id: 'fatigue', label: 'Fatigue / low energy' },
  { id: 'sleep_issues', label: 'Sleep challenges' },
  { id: 'appetite_changes', label: 'Appetite changes' },
  { id: 'anxiety', label: 'Anxiety / worry' },
  { id: 'pain', label: 'Pain' },
  { id: 'headache', label: 'Headache' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'dizziness', label: 'Dizziness' },
  { id: 'breast_soreness', label: 'Breast / chest soreness' },
  { id: 'bleeding', label: 'Bleeding' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

/** Renders the daily check-in form, recent history list, and mood trend summary. */
export const ClientCheckIns: React.FC = () => {
  const { user } = useAuth();
  const [date, setDate] = useState(todayStr);
  const [moodScore, setMoodScore] = useState(5);
  const [physicalSymptoms, setPhysicalSymptoms] = useState<PhysicalSymptom[]>([]);
  const [notes, setNotes] = useState('');
  const [sharedWithProvider, setSharedWithProvider] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState<CheckIn[]>([]);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [alerts, setAlerts] = useState<AlertInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const api = ApiClient.getInstance();
  const userId = user?.id;

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [historyRes, trendsRes] = await Promise.all([
        api.get<CheckIn[] | { checkIns?: CheckIn[]; count?: number }>(
          `/checkins/user/${userId}?limit=30`
        ),
        api.get<{ trends?: TrendData; alerts?: AlertInfo[] }>(
          `/checkins/trends/${userId}?days=30`
        ),
      ]);

      const historyData = Array.isArray(historyRes) ? historyRes : historyRes.checkIns ?? [];
      setHistory(Array.isArray(historyData) ? historyData : []);

      const t = trendsRes.trends;
      const a = trendsRes.alerts ?? [];
      if (t && typeof t === 'object') {
        setTrends(t as TrendData);
      }
      setAlerts(Array.isArray(a) ? (a as AlertInfo[]) : []);
    } catch {
      // Non-critical; user will still be able to submit a new check-in
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const toggleSymptom = (symptom: PhysicalSymptom) => {
    setPhysicalSymptoms(prev =>
      prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    try {
      await api.post('/checkins', {
        date,
        moodScore,
        physicalSymptoms,
        notes: notes.trim() || undefined,
        sharedWithProvider,
      });
      toast.success('Check-in saved for today.');
      setNotes('');
      setPhysicalSymptoms([]);
      setMoodScore(5);
      setDate(todayStr());
      await loadData();
    } catch (err: unknown) {
      const status =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined;
      if (status === 409) {
        toast.error('You already submitted a check-in for this date.');
      } else {
        toast.error(message ?? 'Failed to save check-in.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const moodLabel = (score: number) => {
    if (score <= 3) return 'Very heavy day';
    if (score <= 6) return 'Mixed / tender day';
    return 'Lighter day';
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-medium text-[#4E1B00]">Daily check-ins</h2>
        <p className="text-sm text-[#6B4D37] mt-1">
          A gentle place to notice how you&apos;re doing in your body and emotions—whether you&apos;re
          home with a baby, still pregnant, or moving through postpartum after loss.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in form */}
        <div className="bg-[#FAF7F2] rounded-lg border border-[#DED7CD] p-4 sm:p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#4E1B00]">Today&apos;s check-in</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#4E1B00]/80 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  max={todayStr()}
                  className="w-full rounded-md border border-[#CAC3BC] px-3 py-2 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4E1B00]/80 mb-1">
                  Mood (1–10) <span className="font-normal text-[#6B4D37]/70">(1 = lowest)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={moodScore}
                    onChange={e => setMoodScore(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold text-[#4E1B00] w-8 text-right">
                    {moodScore}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#6B4D37]/70">{moodLabel(moodScore)}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4E1B00]/80 mb-1">
                Physical symptoms (optional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SYMPTOMS.map(symptom => (
                  <label
                    key={symptom.id}
                    className="flex items-center gap-2 text-xs text-[#4E1B00]/80 bg-white border border-[#DED7CD] rounded-md px-2 py-1.5"
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-[#CAC3BC] text-[#6B4D37] focus:ring-[#6B4D37]"
                      checked={physicalSymptoms.includes(symptom.id)}
                      onChange={() => toggleSymptom(symptom.id)}
                    />
                    <span className="truncate">{symptom.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4E1B00]/80 mb-1">
                Notes you&apos;d like to remember (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-[#CAC3BC] px-3 py-2 text-sm focus:ring-[#6B4D37] focus:border-[#6B4D37]"
                placeholder="For example: sleep, feeding, emotional waves, or anything about pregnancy or grief you want your future self and provider to remember."
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-[#4E1B00]/80">
                <input
                  type="checkbox"
                  checked={sharedWithProvider}
                  onChange={e => setSharedWithProvider(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#CAC3BC] text-[#6B4D37] focus:ring-[#6B4D37]"
                />
                <span>
                  Share this check-in with my provider{' '}
                  <span className="text-[#6B4D37]/70">(you can uncheck to keep it private)</span>
                </span>
              </label>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-[#6B4D37] hover:bg-[#5a402e] disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save today’s check-in'}
              </button>
            </div>
          </form>
        </div>

        {/* History & trends */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#DED7CD] p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-[#4E1B00] mb-2">Recent check-ins</h3>
            {loading && history.length === 0 ? (
              <p className="text-sm text-[#6B4D37]/70">Loading your recent check-ins…</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-[#6B4D37]/70">
                No check-ins yet. Even a one-line check-in is enough—especially on hard days.
              </p>
            ) : (
              <ul className="divide-y divide-[#DED7CD] text-sm">
                {history.slice(0, 7).map(checkIn => (
                  <li key={checkIn._id} className="py-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#4E1B00]">{formatDate(checkIn.date)}</p>
                      <p className="text-xs text-[#6B4D37]/70">
                        Mood {checkIn.moodScore} ·{' '}
                        {checkIn.sharedWithProvider ? 'Shared with provider' : 'Visible only to you'}
                      </p>
                      {checkIn.notes && (
                        <p className="mt-1 text-xs text-[#4E1B00]/80 line-clamp-2">{checkIn.notes}</p>
                      )}
                    </div>
                    {checkIn.physicalSymptoms.length > 0 && (
                      <div className="text-right max-w-[40%]">
                        <p className="text-[11px] font-medium text-[#4E1B00]/80">Symptoms</p>
                        <p className="text-[11px] text-[#6B4D37]">
                          {checkIn.physicalSymptoms
                            .map(id => SYMPTOMS.find(s => s.id === id)?.label ?? id)
                            .join(', ')}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {trends && (
            <div className="bg-white rounded-lg border border-[#DED7CD] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#4E1B00]">Last {trends.period}</h3>
                  <p className="text-xs text-[#6B4D37]/70">
                    {trends.checkInCount} check-ins · average mood {trends.averageMood.toFixed(1)} ·{' '}
                    {trends.moodTrend === 'improving'
                      ? 'overall trend is improving'
                      : trends.moodTrend === 'declining'
                        ? 'overall trend is getting heavier'
                        : 'overall trend is stable'}
                  </p>
                </div>
              </div>

              {alerts.length > 0 && (
                <div className="space-y-2">
                  {alerts.map((alert, idx) => (
                    <div
                      key={`${alert.type}-${idx}`}
                      className={`rounded-md px-3 py-2 text-xs ${
                        alert.severity === 'critical'
                          ? 'bg-red-50 text-red-800 border border-red-200'
                          : alert.severity === 'warning'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-[#FAF7F2] text-[#4E1B00] border border-[#DED7CD]'
                      }`}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

