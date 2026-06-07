// File: src/components/ui/Alert.jsx
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

const VARIANTS = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: CheckCircle2,
    iconCls: 'text-emerald-500',
    dismiss: 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100',
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-800',
    icon: AlertTriangle,
    iconCls: 'text-red-500',
    dismiss: 'text-red-400 hover:text-red-600 hover:bg-red-100',
  },
  info: {
    wrapper: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: CheckCircle2,
    iconCls: 'text-blue-500',
    dismiss: 'text-blue-400 hover:text-blue-600 hover:bg-blue-100',
  },
};

export function Alert({ children, variant = 'info', onDismiss }) {
  const v = VARIANTS[variant] || VARIANTS.info;
  const Icon = v.icon;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${v.wrapper}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${v.iconCls}`} />
      <span className="flex-1">{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} className={`shrink-0 rounded-full p-0.5 transition ${v.dismiss}`}>
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
