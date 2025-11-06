// Simplified Schema Types for GDPR-Compliant Bright Pearl

export type ReportStatus = 'pending' | 'approved' | 'rejected';
export type ActivityStatus = 'active' | 'deleted';

export type Platform = 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'reddit' | 'other';

// Content types per platform
export const CONTENT_TYPES: Record<Platform, string[]> = {
  twitter: ['tweet', 'reply', 'retweet', 'quote'],
  facebook: ['post', 'comment', 'share', 'reel'],
  instagram: ['post', 'story', 'reel', 'comment'],
  youtube: ['video', 'comment', 'short'],
  tiktok: ['video', 'comment'],
  reddit: ['post', 'comment'],
  other: ['content'],
};

// Main Report interface (simplified)
export interface Report {
  id: number;
  content_link: string;
  content_link_normalized: string;
  platform: Platform;
  country: string; // ISO 3166-1 alpha-2
  language: string; // ISO 639-1
  content_type: string;
  description?: string; // Optional context for moderators only (not displayed publicly)
  activity_status: ActivityStatus;
  status: ReportStatus;
  report_count: number;
  submitter_ip_hash?: string; // Not displayed publicly
  created_at: string;
  updated_at: string;
}

// Public display format (what users see)
export interface PublicReport {
  id: number;
  title: string; // "Content #123 – post on facebook"
  content_link: string;
  platform: Platform;
  country: string;
  language: string;
  content_type: string;
  activity_status: ActivityStatus;
  report_count: number;
  created_at: string;
}

// Submission form data
export interface SubmitReportData {
  content_link: string;
  platform: Platform;
  country: string;
  language: string;
  content_type: string;
}

// Moderator action log
export interface ModeratorAction {
  id: number;
  report_id: number;
  moderator_id: string;
  action: 'approve' | 'reject' | 'update_status';
  created_at: string;
}

// Statistics for dashboard
export interface DashboardStats {
  total_reports: number;
  approved_reports: number;
  pending_reports: number;
  rejected_reports: number;
  active_content: number;
  deleted_content: number;
  by_platform: Record<Platform, number>;
  by_country: Record<string, number>;
}

// Filter options for public dashboard
export interface ReportFilters {
  platform?: Platform;
  country?: string;
  language?: string;
  activity_status?: ActivityStatus;
  search?: string;
}
