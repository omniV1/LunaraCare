/**
 * @module components/client/UpdateBabyBirthDate
 * Small card that lets clients set or update their delivery date,
 * which drives personalized postpartum recommendations.
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { UserService } from '../../services/userService';
import { toast } from 'react-toastify';
import { Card } from '../ui/Card';

// Type guard for objects with toISOString method
interface DateLike {
  toISOString: () => string;
}

const isDateLike = (value: unknown): value is DateLike => {
  return (
    value !== null &&
    typeof value === 'object' &&
    'toISOString' in value &&
    typeof (value as DateLike).toISOString === 'function'
  );
};

const parseBirthDate = (rawValue: unknown): Date | null => {
  try {
    // If it's already a string in ISO format, parse it
    if (typeof rawValue === 'string') {
      return new Date(rawValue);
    }
    // If it's a Date object, use it directly
    if (rawValue instanceof Date) {
      return rawValue;
    }
    // If it has a toISOString method (MongoDB Date object), convert it
    if (isDateLike(rawValue)) {
      try {
        return new Date(rawValue.toISOString());
      } catch {
        return null;
      }
    }
    // If it's a number (timestamp), convert it
    if (typeof rawValue === 'number') {
      return new Date(rawValue);
    }
    return null;
  } catch {
    return null;
  }
};

/** Card for viewing and updating the client's delivery date. */
export const UpdateBabyBirthDate: React.FC = () => {
  const { user } = useAuth();
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentBirthDate, setCurrentBirthDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load current profile to get existing birth date
    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        setError(null);
        const profile = await UserService.getInstance().getCurrentProfile();

        // Backend returns: { user: {...}, profile: {...} } where profile is the Client document
        const clientProfile = (profile as { profile?: { babyBirthDate?: unknown } })?.profile;

        if (!clientProfile) {
          setLoadingProfile(false);
          return;
        }

        if (clientProfile?.babyBirthDate) {
          const parsedDate = parseBirthDate(clientProfile.babyBirthDate);
          if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
            const dateString = parsedDate.toISOString().split('T')[0];
            setCurrentBirthDate(dateString);
            setBabyBirthDate(dateString);
          }
        }
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Failed to load profile. Please refresh the page.');
      } finally {
        setLoadingProfile(false);
      }
    };

    if (user?.role === 'client') {
      loadProfile();
    } else {
      setLoadingProfile(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyBirthDate) {
      toast.error('Please select a birth date');
      return;
    }

    setLoading(true);
    try {
      await UserService.getInstance().updateProfile({
        babyBirthDate: babyBirthDate,
      });
      toast.success('Delivery date updated successfully.');
      setCurrentBirthDate(babyBirthDate);
      // Just update the local state - don't reload the page
      // The recommendations will update when the user navigates or the component refreshes
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : error instanceof Error
            ? error.message
            : undefined;
      toast.error(message ?? 'Failed to update birth date');
    } finally {
      setLoading(false);
    }
  };

  // Always return something to prevent blank page
  return (
    <Card className="bg-white">
      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => globalThis.location.reload()}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Refresh Page
            </button>
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold text-sage-800 mb-1">Delivery Date</h3>
          <p className="text-sm text-sage-600">
            Set your delivery date to see personalized support recommendations based on where you
            are in your postpartum journey.
          </p>
        </div>

        {currentBirthDate &&
          (() => {
            try {
              const date = new Date(currentBirthDate);
              if (!Number.isNaN(date.getTime())) {
                const formattedDate = date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                return (
                  <div className="bg-sage-50 border border-sage-200 rounded-md p-3">
                    <p className="text-sm text-sage-700">
                      <span className="font-medium">Current:</span> {formattedDate}
                    </p>
                  </div>
                );
              }
            } catch {
              // Date formatting failed, use fallback
            }
            return null;
          })()}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="babyBirthDate" className="block text-sm font-medium text-sage-700 mb-2">
              Delivery Date
            </label>
            {loadingProfile ? (
              <div className="w-full px-3 py-2 border border-sage-300 rounded-md bg-sage-50 text-sage-600 text-sm">
                Loading current date...
              </div>
            ) : (
              <input
                type="date"
                id="babyBirthDate"
                value={babyBirthDate}
                onChange={e => setBabyBirthDate(e.target.value)}
                className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                required
              />
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            {loading ? 'Updating...' : 'Update Delivery Date'}
          </button>
        </form>
      </div>
    </Card>
  );
};
