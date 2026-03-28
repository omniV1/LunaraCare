import React from 'react';
import type { CheckinReviewItem } from '../../../pages/providerDashboardUtils';

interface CheckInsReviewSectionProps {
  checkinsNeedingReview: CheckinReviewItem[];
  checkinsLoading: boolean;
  onCheckinsDetail: (clientUserId: string, clientName: string) => void;
  onMarkReviewed: (clientUserId: string) => void;
}

export const CheckInsReviewSection: React.FC<CheckInsReviewSectionProps> = ({
  checkinsNeedingReview,
  checkinsLoading,
  onCheckinsDetail,
  onMarkReviewed,
}) => {
  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border mb-6 sm:mb-8">
      <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
        <h2 className="text-lg font-medium text-dash-text-primary">Check-ins needing attention</h2>
        <p className="text-sm text-dash-text-secondary/60 mt-1">
          Clients whose recent check-ins suggest heavier days—whether they&apos;re caring
          for a baby, still pregnant, or recovering after loss.
        </p>
      </div>
      <div className="p-4 sm:p-6">
        {checkinsLoading ? (
          <p className="text-sm text-dash-text-secondary/60">Loading check-ins…</p>
        ) : checkinsNeedingReview.length === 0 ? (
          <p className="text-sm text-dash-text-secondary/60">
            No check-ins need your review right now. This includes clients sharing about
            feeding, sleep, mood, or grief—if anything shifts, they&apos;ll appear here.
          </p>
        ) : (
          <ul className="divide-y divide-dash-section-border">
            {checkinsNeedingReview.slice(0, 6).map((item) => {
              const clientName = item.clientName ?? 'Client';
              const clientUserId = item.clientUserId ?? item.clientId;
              const lastDate =
                item.lastCheckIn &&
                new Date(item.lastCheckIn).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              const alerts = (item.alerts ?? []) as Array<{
                type: string;
                message: string;
                severity: 'info' | 'warning' | 'critical';
              }>;
              return (
                <li key={String(clientUserId)} className="py-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-dash-text-primary truncate">{clientName}</p>
                      {lastDate && (
                        <p className="text-xs text-dash-text-secondary/60">
                          Last check-in: <span className="font-mono">{lastDate}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                      {clientUserId && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              onCheckinsDetail(
                                String(clientUserId),
                                clientName,
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium text-dash-text-secondary bg-dash-card border border-dash-border rounded-md hover:bg-[#EDE8E0]/50"
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            onClick={() => onMarkReviewed(String(clientUserId))}
                            className="px-3 py-1.5 text-xs font-medium text-[#6B4D37] bg-[#6B4D37]/5 hover:bg-[#6B4D37]/10 rounded-md border border-[#6B4D37]/20"
                          >
                            Mark reviewed
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {alerts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {alerts.map((alert, idx) => (
                        <span
                          key={`${alert.type}-${idx}`}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] ${
                            alert.severity === 'critical'
                              ? 'bg-red-50 text-red-800 border border-red-200'
                              : alert.severity === 'warning'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-[#6B4D37]/5 text-[#4E1B00] border border-[#6B4D37]/20'
                          }`}
                        >
                          {alert.message}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
