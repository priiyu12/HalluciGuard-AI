/**
 * Maps a risk level ('Low', 'Medium', 'High') to Tailwind color classes.
 */
export function getRiskColorClass(level) {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'medium':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'high':
      return 'text-rose-700 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}

export function getRiskTextColor(level) {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'text-emerald-600';
    case 'medium':
      return 'text-amber-600';
    case 'high':
      return 'text-rose-600';
    default:
      return 'text-slate-600';
  }
}

export function getRiskBgColor(level) {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'bg-emerald-500';
    case 'medium':
      return 'bg-amber-500';
    case 'high':
      return 'bg-rose-500';
    default:
      return 'bg-slate-500';
  }
}

export function getRiskBorderColor(level) {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'border-emerald-200';
    case 'medium':
      return 'border-amber-200';
    case 'high':
      return 'border-rose-200';
    default:
      return 'border-slate-200';
  }
}
