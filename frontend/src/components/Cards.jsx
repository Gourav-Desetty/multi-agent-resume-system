import React from 'react';

export function Card({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-brand-text leading-6">{title}</h3>
          {subtitle && <p className="text-xs text-brand-muted mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatsCard({ title, value, icon: Icon, change, trend = 'neutral', className = '' }) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-brand-muted'
  };

  return (
    <div className={`bg-brand-card border border-brand-border rounded-xl p-5 flex items-center justify-between shadow-lg ${className}`}>
      <div className="space-y-1">
        <span className="text-xs font-medium text-brand-muted uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          {change && (
            <span className={`text-xs font-semibold ${trendColors[trend]}`}>
              {change}
            </span>
          )}
        </div>
      </div>
      {Icon && (
        <div className="p-3 bg-brand-dark rounded-lg border border-brand-border text-brand-primary">
          <Icon size={20} />
        </div>
      )}
    </div>
  );
}
