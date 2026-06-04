'use client';

import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui-store';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={14} style={{ color: 'hsl(142,72%,50%)' }} />,
  error:   <XCircle    size={14} style={{ color: 'hsl(0,84%,60%)' }} />,
  warning: <AlertTriangle size={14} style={{ color: 'hsl(38,92%,58%)' }} />,
  info:    <Info       size={14} style={{ color: 'hsl(210,80%,60%)' }} />,
};

const BAR_COLORS = {
  success: 'hsl(142,72%,50%)',
  error:   'hsl(0,84%,60%)',
  warning: 'hsl(38,92%,58%)',
  info:    'hsl(210,80%,60%)',
};

function ToastItem({ id, type, message, duration = 3000 }: {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}) {
  const removeToast = useUiStore((s) => s.removeToast);

  useEffect(() => {
    const t = setTimeout(() => removeToast(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, removeToast]);

  return (
    <div
      className="relative flex items-start gap-2.5 px-4 py-3 rounded-xl overflow-hidden"
      style={{
        background: 'hsl(var(--bg-elevated))',
        border: '1px solid hsl(var(--border-default))',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '260px',
        maxWidth: '340px',
        animation: 'slideInRight 0.25s ease',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: BAR_COLORS[type] }}
      />

      {/* Icon */}
      <span className="mt-0.5 flex-shrink-0">{ICONS[type]}</span>

      {/* Message */}
      <p className="flex-1 text-xs font-medium leading-relaxed" style={{ color: 'hsl(var(--text-primary))' }}>
        {message}
      </p>

      {/* Close */}
      <button
        onClick={() => removeToast(id)}
        className="flex-shrink-0 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: 'hsl(var(--text-muted))' }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function ToastStack() {
  const toasts = useUiStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        className="fixed flex flex-col gap-2 pointer-events-none"
        style={{
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem {...t} />
          </div>
        ))}
      </div>
    </>
  );
}
