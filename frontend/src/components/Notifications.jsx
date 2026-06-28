import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function Notification({ message, type = 'info', onClose }) {
  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-400'
  };

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle
  };

  const Icon = icons[type];

  return (
    <div className={`flex items-start justify-between border rounded-xl p-4 ${styles[type]} shadow-lg transition duration-200`}>
      <div className="flex space-x-3">
        <Icon className="mt-0.5 shrink-0" size={18} />
        <div>
          <p className="text-sm font-medium leading-5">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:bg-brand-dark/20 rounded transition">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
