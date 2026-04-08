/**
 * @module components/client/appointments/AppointmentStatusBadge
 * Small colored badge that displays a human-readable appointment status label.
 */
import React from 'react';
import { Appointment, STATUS_BADGE, STATUS_LABELS } from './types';

/** Props for the appointment status badge. */
export interface AppointmentStatusBadgeProps {
  status: Appointment['status'];
  className?: string;
}

/** Colored pill badge displaying a human-readable appointment status. */
export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({ status, className = '' }) => (
  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${STATUS_BADGE[status]} ${className}`}>
    {STATUS_LABELS[status]}
  </span>
);
