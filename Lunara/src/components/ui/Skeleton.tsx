import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton - A loading placeholder component
 *
 * Usage:
 * ```tsx
 * <Skeleton variant="text" width="100%" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" height={200} />
 * ```
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <output
      className={`${baseClasses} ${animationClasses[animation]} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-label="Loading..."
    />
  );
};

/**
 * CardSkeleton - Skeleton for card-like content
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
    <div className="flex items-center mb-4">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="ml-4 flex-1">
        <Skeleton variant="text" width="60%" className="mb-2" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="text" className="mb-2" />
    <Skeleton variant="text" className="mb-2" />
    <Skeleton variant="text" width="80%" />
  </div>
);

/**
 * TableRowSkeleton - Skeleton for table rows
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }, (_, i) => ({ id: `skeleton-col-${columns}-${i}` })).map(
      ({ id }, i) => (
        <td key={id} className="px-6 py-4">
          <Skeleton variant="text" width={i === 0 ? '80%' : '60%'} />
        </td>
      )
    )}
  </tr>
);

/**
 * DashboardStatSkeleton - Skeleton for dashboard stat cards
 */
export const DashboardStatSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center">
      <div className="p-2 bg-gray-200 rounded-lg">
        <div className="w-6 h-6" />
      </div>
      <div className="ml-4 flex-1">
        <Skeleton variant="text" width="60%" className="mb-2 h-3" />
        <Skeleton variant="text" width="40%" className="h-6" />
      </div>
    </div>
  </div>
);

/**
 * ListItemSkeleton - Skeleton for list items
 */
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center p-4 border-b border-gray-100 animate-pulse">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="ml-4 flex-1">
      <Skeleton variant="text" width="70%" className="mb-2" />
      <Skeleton variant="text" width="50%" className="h-3" />
    </div>
    <Skeleton variant="rounded" width={80} height={32} />
  </div>
);

/**
 * BlogPostSkeleton - Skeleton for blog post cards
 */
export const BlogPostSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
    <Skeleton variant="rectangular" height={200} className="w-full" />
    <div className="p-6">
      <Skeleton variant="text" width="30%" className="mb-2 h-3" />
      <Skeleton variant="text" className="mb-2 h-6" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" width="80%" className="mb-4" />
      <div className="flex items-center">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="text" width="40%" className="ml-3" />
      </div>
    </div>
  </div>
);

/**
 * ResourceCardSkeleton - Skeleton for resource cards
 */
export const ResourceCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <Skeleton variant="text" width="60%" className="h-5" />
      <Skeleton variant="rounded" width={60} height={24} />
    </div>
    <Skeleton variant="text" className="mb-2" />
    <Skeleton variant="text" className="mb-2" />
    <Skeleton variant="text" width="70%" className="mb-4" />
    <div className="flex gap-2">
      <Skeleton variant="rounded" width={60} height={24} />
      <Skeleton variant="rounded" width={80} height={24} />
    </div>
  </div>
);

/**
 * FormSkeleton - Skeleton for form fields
 */
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 3 }) => (
  <div className="space-y-6 animate-pulse">
    {Array.from({ length: fields }, (_, i) => ({ id: `skeleton-field-${fields}-${i}` })).map(
      ({ id }) => (
        <div key={id}>
          <Skeleton variant="text" width="30%" className="mb-2 h-3" />
          <Skeleton variant="rounded" height={40} />
        </div>
      )
    )}
    <div className="flex justify-end gap-4 mt-6">
      <Skeleton variant="rounded" width={100} height={40} />
      <Skeleton variant="rounded" width={100} height={40} />
    </div>
  </div>
);

/**
 * PageSkeleton - Full page loading skeleton
 */
export const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8 animate-pulse">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Skeleton variant="text" width="30%" className="h-8 mb-2" />
        <Skeleton variant="text" width="50%" className="h-4" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
      </div>

      {/* Content area */}
      <div className="bg-white rounded-lg shadow p-6">
        <Skeleton variant="text" width="40%" className="h-6 mb-6" />
        <div className="space-y-4">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>
    </div>
  </div>
);
