import React from 'react';

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`border-brand-primary border-t-transparent rounded-full animate-spin ${sizeClasses[size]} ${className}`}></div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`bg-brand-border/60 animate-pulse rounded ${className}`}></div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Spinner size="lg" />
      <p className="text-sm text-brand-muted animate-pulse font-mono">Loading data pipeline...</p>
    </div>
  );
}
