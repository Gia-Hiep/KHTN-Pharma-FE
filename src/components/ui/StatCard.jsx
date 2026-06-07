// File: src/components/ui/StatCard.jsx

const COLORS = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-100',    icon: 'text-blue-600',    value: 'text-blue-700' },
  green:   { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-600', value: 'text-emerald-700' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-100',  icon: 'text-violet-600',  value: 'text-violet-700' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-100',   icon: 'text-amber-600',   value: 'text-amber-700' },
  red:     { bg: 'bg-red-50',     border: 'border-red-100',     icon: 'text-red-600',     value: 'text-red-700' },
  cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-100',    icon: 'text-cyan-600',    value: 'text-cyan-700' },
  slate:   { bg: 'bg-slate-50',   border: 'border-slate-100',   icon: 'text-slate-600',   value: 'text-slate-700' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-100',  icon: 'text-indigo-600',  value: 'text-indigo-700' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-100',    icon: 'text-teal-600',    value: 'text-teal-700' },
};

export function StatCard({ icon, label, value, color = 'green', trend, className = '' }) {
  const c = COLORS[color] || COLORS.green;

  // icon can be: React element (Lucide component), emoji string, or rendered component
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <span className="text-2xl">{icon}</span>;
    }
    // If it's a React element (already rendered like <DollarSign />)
    if (typeof icon === 'object' && icon.$$typeof) {
      return <span className={`${c.icon}`}>{icon}</span>;
    }
    // If it's a component reference (like DollarSign without <>)
    const IconComp = icon;
    return <IconComp className={`h-6 w-6 ${c.icon}`} />;
  };

  return (
    <div
      className={`rounded-2xl border ${c.border} ${c.bg} p-4 hover-elevate ${className}`}
    >
      <div className="mb-1">{renderIcon()}</div>
      <div className={`text-xl font-extrabold ${c.value} break-words`}>{value}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-slate-500">{label}</span>
        {trend != null && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend >= 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>
    </div>
  );
}
