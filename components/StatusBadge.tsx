type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'primary';

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-surface-cool text-ink/60',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  primary: 'bg-primary/10 text-primary',
};

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function StatusBadge({ label, variant = 'default' }: StatusBadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-mono uppercase tracking-wider ${VARIANT_CLASSES[variant]}`}>
      {label}
    </span>
  );
}

export function getTierVariant(tier: string): BadgeVariant {
  switch (tier) {
    case 'pro': return 'primary';
    case 'basic': return 'default';
    case 'center': return 'warning';
    default: return 'default';
  }
}

export function getStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'active': return 'success';
    case 'trial': return 'warning';
    case 'suspended': return 'destructive';
    case 'verified': return 'success';
    case 'pending': return 'warning';
    case 'open': return 'warning';
    case 'in_progress': return 'primary';
    case 'resolved': return 'success';
    default: return 'default';
  }
}

export function getPriorityVariant(priority: string): BadgeVariant {
  switch (priority) {
    case 'urgent': return 'destructive';
    case 'high': return 'warning';
    default: return 'default';
  }
}
