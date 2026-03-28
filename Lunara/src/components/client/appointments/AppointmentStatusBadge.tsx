import React from 'react';
import { Appointment, STATUS_BADGE, STATUS_LABELS } from './types';

export interface AppointmentStatusBadgeProps {
  status: Appointment['status'];
  className?: string;
}

export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({ status, className = '' }) => (
  <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${STATUS_BADGE[status]} ${className}`}>
    {STATUS_LABELS[status]}
  </span>
);
