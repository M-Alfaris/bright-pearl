// Database Schema Types for Bright Pearl

export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'published';
export type PlatformStatus = 'active' | 'removed' | 'unknown';
export type ReportCategory =
  | 'hate_speech'
  | 'harassment'
  | 'violence'
  | 'discrimination'
  | 'misinformation'
  | 'other';

export type ModeratorAction = 'approve' | 'reject' | 'escalate' | 'update_status';

export interface Report {
  id: string;
  submitter_email?: string;
  submitter_ip_hash?: string;
  platform: string;
  original_url: string;
  title: string;
  description: string;
  category: ReportCategory;
  language: string; // ISO code
  country: string; // ISO code
  platform_status: PlatformStatus;
  status: ReportStatus;
  moderation_notes?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  report_id: string;
  storage_path: string;
  thumbnail_path?: string;
  type: 'screenshot' | 'thumbnail';
  created_at: string;
}

export interface ModeratorActionLog {
  id: string;
  report_id: string;
  moderator_id: string;
  action: ModeratorAction;
  comment?: string;
  created_at: string;
}

export interface StatsSnapshot {
  id: string;
  snapshot_time: string;
  json_metrics: Record<string, any>;
}

export interface DashboardStats {
  total_reports: number;
  pending_reports: number;
  approved_reports: number;
  rejected_reports: number;
  by_platform: Record<string, number>;
  by_country: Record<string, number>;
  by_status: Record<string, number>;
}
