import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { ApiClient } from '../../api/apiClient';
import { useAuth } from '../../contexts/useAuth';
import { toast } from 'react-toastify';

// Dynamically import MoodOrb to keep three.js out of the main bundle
const MoodOrb = React.lazy(() =>
  import('./MoodOrb').then(mod => ({ default: mod.MoodOrb }))
);

interface MoodOption {
  id: string;
  label: string;
  color: string;
  intensity: number; // 0 = most distressed, 1 = most positive
  score: number;
}

const MOOD_OPTIONS: MoodOption[] = [
  { id: 'need_help', label: 'Need support now', color: '#EF4444', intensity: 0.0, score: 1 },
  { id: 'check_in', label: 'Having a tough day', color: '#F97316', intensity: 0.25, score: 3 },
  { id: 'meh',      label: 'Hanging in there', color: '#EAB308', intensity: 0.5, score: 5 },
  { id: 'calm',     label: 'Doing alright', color: '#EC4899', intensity: 0.75, score: 7 },
  { id: 'great',    label: 'Doing well', color: '#22C55E', intensity: 1.0, score: 10 },
];

const DEFAULT_COLOR = '#D4956B';
const DEFAULT_INTENSITY = 0.5;
// Prevent mood-check-in fatigue: limit to once per hour per clinical guidance
const COOLDOWN_MS = 60 * 60 * 1000;

function formatTimeLeft(ms: number): string {
  const mins = Math.ceil(ms / 60000);
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}

export const MoodCheckIn: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [hoverMood, setHoverMood] = useState<MoodOption | null>(null);
  const [onCooldown, setOnCooldown] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shareWithProvider, setShareWithProvider] = useState(true);

  const checkCooldown = useCallback(() => {
    if (!userId) return false;
    const lastCheckIn = localStorage.getItem(`mood_checkin_${userId}`);
    if (!lastCheckIn) return false;

    const elapsed = Date.now() - new Date(lastCheckIn).getTime();
    if (elapsed < COOLDOWN_MS) {
      setTimeLeft(formatTimeLeft(COOLDOWN_MS - elapsed));
      return true;
    }
    return false;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const savedMood = localStorage.getItem(`mood_selection_${userId}`);
    if (savedMood) {
      const found = MOOD_OPTIONS.find(m => m.id === savedMood);
      if (found) setSelectedMood(found);
    }

    const isCooling = checkCooldown();
    setOnCooldown(isCooling);

    const timer = setInterval(() => {
      const still = checkCooldown();
      setOnCooldown(still);
    }, 30000);
    return () => clearInterval(timer);
  }, [userId, checkCooldown]);

  const handleSelect = (mood: MoodOption) => {
    setSelectedMood(mood);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !userId) return;
    setSubmitting(true);
    try {
      await ApiClient.getInstance().post('/checkins', {
        moodScore: selectedMood.score,
        date: new Date().toISOString(),
        notes: `Mood: ${selectedMood.label}`,
        sharedWithProvider: shareWithProvider,
      });
      setOnCooldown(true);
      setTimeLeft(formatTimeLeft(COOLDOWN_MS));
      localStorage.setItem(`mood_checkin_${userId}`, new Date().toISOString());
      localStorage.setItem(`mood_selection_${userId}`, selectedMood.id);
      toast.success('Check-in recorded!');
    } catch {
      toast.error('Failed to record check-in');
    }
    setSubmitting(false);
  };

  // Hover previews the orb; otherwise show selected or default
  const displayMood = hoverMood ?? selectedMood;
  const activeColor = displayMood?.color ?? DEFAULT_COLOR;
  const activeIntensity = displayMood?.intensity ?? DEFAULT_INTENSITY;

  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-[#AA6641] to-[#D4956B]" />
        <div>
          <h3 className="font-roman text-lg text-dash-text-primary tracking-wide">How are you feeling?</h3>
          <p className="text-sm text-dash-text-secondary/60 mt-0.5">Your daily mood check-in</p>
        </div>
      </div>

      {/* 3D Mood Orb - lazy loaded to defer three.js */}
      <Suspense fallback={
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4956B]" />
        </div>
      }>
        <MoodOrb color={activeColor} intensity={activeIntensity} label={displayMood?.label ?? 'Mood orb'} />
      </Suspense>

      {/* Current mood label */}
      {displayMood && (
        <p
          className="text-center text-sm font-medium tracking-wide mb-4 transition-colors duration-500"
          style={{ color: displayMood.color }}
        >
          {displayMood.label}
        </p>
      )}

      {/* Mood selector */}
      <div className="space-y-4">
        <div
          className="flex justify-center gap-2 sm:gap-3 flex-wrap"
          onPointerLeave={() => setHoverMood(null)}
        >
          {MOOD_OPTIONS.map((mood) => {
            const isSelected = selectedMood?.id === mood.id;
            const isHovered = hoverMood?.id === mood.id;
            const disabled = submitting || onCooldown;
            return (
              <button
                key={mood.id}
                type="button"
                disabled={disabled}
                aria-pressed={isSelected}
                onPointerEnter={() => setHoverMood(mood)}
                onClick={() => !onCooldown && handleSelect(mood)}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl transition-all duration-300 min-w-[68px] border overflow-hidden ${
                  isSelected
                    ? 'ring-2 scale-105 shadow-lg'
                    : isHovered && !onCooldown
                      ? 'scale-105 shadow-md'
                      : 'hover:scale-105 hover:shadow-sm'
                } disabled:opacity-60`}
                style={{
                  backgroundColor: `${mood.color}${isSelected || (isHovered && !onCooldown) ? '20' : '10'}`,
                  borderColor: isSelected || (isHovered && !onCooldown) ? mood.color : `${mood.color}40`,
                  // @ts-expect-error Tailwind ring color via CSS custom property
                  '--tw-ring-color': mood.color,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full transition-all duration-300"
                  style={{
                    background: `radial-gradient(circle at 35% 35%, ${mood.color}90, ${mood.color})`,
                    boxShadow: isSelected || (isHovered && !onCooldown) ? `0 0 12px 4px ${mood.color}50` : 'none',
                  }}
                />
                <span className="text-[10px] font-medium text-dash-text-secondary/80 leading-tight text-center">
                  {mood.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cooldown notice */}
        {onCooldown && (
          <div className="text-center space-y-1">
            <p className="text-sm text-dash-text-secondary/60 font-roman">
              Check-in recorded. You can update in{' '}
              <span className="font-medium text-dash-text-primary/70">{timeLeft}</span>
            </p>
          </div>
        )}

        {/* Share toggle */}
        {!onCooldown && selectedMood && (
          <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={shareWithProvider}
              onChange={(e) => setShareWithProvider(e.target.checked)}
              className="w-4 h-4 rounded border-dash-border text-[#6B4D37] focus:ring-[#6B4D37]/30"
            />
            <span className="text-xs text-dash-text-secondary/70">Share with my provider</span>
          </label>
        )}

        {/* Submit / Update button */}
        {!onCooldown && selectedMood && (
          <div className="flex justify-center">
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${selectedMood.color}, ${selectedMood.color}CC)`,
                boxShadow: `0 4px 14px ${selectedMood.color}40`,
              }}
            >
              {submitting ? 'Saving...' : `Check in as "${selectedMood.label}"`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
