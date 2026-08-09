import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
};

export const SkeletonMetric: React.FC = () => {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
};

export const SkeletonChart: React.FC = () => {
  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
};

export const SkeletonCompanyDetail: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <Skeleton className="h-6 w-24 bg-slate-800 rounded-full" />
        </div>
        <Skeleton className="h-5 w-2/3 bg-slate-800" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
          <Skeleton className="h-16 w-full bg-slate-800 rounded-2xl" />
          <Skeleton className="h-16 w-full bg-slate-800 rounded-2xl" />
          <Skeleton className="h-16 w-full bg-slate-800 rounded-2xl" />
          <Skeleton className="h-16 w-full bg-slate-800 rounded-2xl" />
        </div>
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SkeletonMetric />
        <SkeletonMetric />
        <SkeletonMetric />
      </div>

      {/* Chart Skeleton */}
      <SkeletonChart />
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
};
