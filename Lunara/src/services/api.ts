/**
 * @module api
 * Lightweight calendar-oriented API helpers for fetching appointments
 * and provider availability within a date range.
 */

import { ApiClient } from '../api/apiClient';
import { Appointment, ProviderAvailability } from '../types/api';
import { format } from 'date-fns';

/** @returns The singleton {@link ApiClient} instance. */
const getApi = (): ApiClient => ApiClient.getInstance();

/**
 * Fetches appointments that fall within the given date range.
 * @param startDate - Range start (inclusive).
 * @param endDate - Range end (inclusive).
 * @returns Array of matching {@link Appointment} objects.
 */
export const fetchAppointments = async (startDate: Date, endDate: Date): Promise<Appointment[]> => {
  // Assuming your backend expects dates in 'yyyy-MM-dd' format or similar
  // And that there's an endpoint that can filter by a date range.
  const params = new URLSearchParams({
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  });
  // Replace '/appointments/calendar' with your actual endpoint for fetching appointments for a calendar view
  return getApi().get<Appointment[]>(`/appointments/calendar?${params.toString()}`);
};

/**
 * Fetches a provider's availability slots within a date range.
 * @param providerId - Numeric ID of the provider.
 * @param startDate - Range start (inclusive).
 * @param endDate - Range end (inclusive).
 * @returns Array of {@link ProviderAvailability} slots.
 */
export const fetchProviderAvailability = async (
  providerId: number,
  startDate: Date,
  endDate: Date
): Promise<ProviderAvailability[]> => {
  // This is a placeholder. You might need to adjust based on how your API handles provider availability fetching with date ranges.
  // If the backend GET /providers/{providerId}/availability doesn't accept date ranges,
  // you might fetch all and filter, or this might need a different endpoint.
  const params = new URLSearchParams({
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  });
  // Replace with your actual endpoint for provider availability in a range
  return getApi().get<ProviderAvailability[]>(
    `/providers/${providerId}/availability/calendar?${params.toString()}`
  );
};
