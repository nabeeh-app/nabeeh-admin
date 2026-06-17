export type AdminRole = 'super_admin' | 'support_agent' | 'viewer';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  role: AdminRole;
  name: string;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'center';
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled' | 'expired' | 'suspended';

export interface Subscription {
  id: string;
  teacher_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'vodafone_cash' | 'instapay' | 'paymob' | 'cash' | 'bank_transfer' | 'other';
export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'refunded';

export interface Payment {
  id: string;
  teacher_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  receipt_url: string | null;
  reference_number: string | null;
  notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  subscription_id: string | null;
  created_at: string;
}

export interface AiUsageLog {
  id: string;
  teacher_id: string;
  feature: string;
  tokens_used: number;
  model: string;
  created_at: string;
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  teacher_id: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subjects: string[] | null;
  created_at: string;
  updated_at: string;
  subscription?: Subscription;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface PlatformMetrics {
  total_teachers: number;
  active_teachers: number;
  trial_teachers: number;
  expired_teachers: number;
  total_students: number;
  total_assistants: number;
  mrr: number;
  active_subscriptions_by_tier: Record<SubscriptionTier, number>;
  whatsapp_messages_today: number;
  whatsapp_messages_week: number;
  whatsapp_messages_month: number;
  ai_tokens_today: number;
  ai_tokens_month: number;
}
