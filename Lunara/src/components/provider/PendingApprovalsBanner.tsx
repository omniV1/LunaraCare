/**
 * @module components/provider/PendingApprovalsBanner
 * Alert banner listing appointment requests awaiting provider approval
 * with inline approve/decline buttons.
 */
import React from 'react';
import { Appointment, clientName, formatDate, formatTime } from './calendarTypes';

/** Props for the pending approvals banner. */
export interface PendingApprovalsBannerProps {
  pendingApprovals: Appointment[];
  actionId: string | null;
  onConfirm: (id: string) => void;
  onDecline: (id: string) => void;
}

/** Banner listing pending appointment requests with approve/decline actions. */
export const PendingApprovalsBanner: React.FC<PendingApprovalsBannerProps> = ({
  pendingApprovals,
  actionId,
  onConfirm,
  onDecline,
}) => {
  if (pendingApprovals.length === 0) return null;

  return (
    <div className="bg-[#AA6641]/5 border border-[#AA6641]/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2.5 h-2.5 rounded-full bg-[#AA6641] shrink-0" />
        <h3 className="font-semibold text-[#AA6641] text-sm">
          {pendingApprovals.length} appointment{pendingApprovals.length !== 1 ? 's' : ''} awaiting approval
        </h3>
      </div>
      <ul className="divide-y divide-[#AA6641]/10">
        {pendingApprovals.map((appt) => (
          <li key={appt._id} className="py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-dash-text-primary text-sm">{clientName(appt)}</p>
              <p className="text-xs text-dash-text-secondary/80 mt-0.5">
                {formatDate(appt.startTime)} · {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                {appt.type && ` · ${appt.type === 'virtual' ? 'Virtual' : 'In-person'}`}
              </p>
              {appt.notes && <p className="text-xs text-dash-text-secondary/60 mt-0.5 italic">"{appt.notes}"</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onConfirm(appt._id)}
                disabled={actionId !== null}
                className="px-3 py-1.5 text-xs font-medium bg-[#3F4E4F] text-white rounded-md hover:bg-[#2C3639] disabled:opacity-50"
              >
                {actionId === appt._id ? '...' : 'Approve'}
              </button>
              <button
                type="button"
                onClick={() => onDecline(appt._id)}
                disabled={actionId !== null}
                className="px-3 py-1.5 text-xs font-medium border border-dash-border text-dash-text-secondary rounded-md hover:bg-[#EDE8E0]/50 disabled:opacity-50"
              >
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
