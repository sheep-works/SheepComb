export interface LqaIssue {
  id: number;
  file_prefix?: string;
  clip_path?: string;
  snapshot_path?: string;
  timestamp_start?: number;
  timestamp_end?: number;
  issue_tag?: string;
  description?: string;
  [key: string]: unknown;
}

export interface LqaIssueReview extends LqaIssue {
  comment: string;
  status?: 'open' | 'in_progress' | 'fixed' | 'won_t_fix' | string;
  severity?: 'critical' | 'major' | 'minor' | 'trivial' | string;
  category?: string;
  assignee?: string;
}

export interface IssueExporter {
  id: string;
  name: string;
  description?: string;
  fileExtension: string;
  mimeType: string;
  export(issues: LqaIssueReview[]): string | Blob | Promise<string | Blob>;
}

export interface SaveOptions {
  silent?: boolean;
  reason?: 'manual' | 'interval' | 'page_change' | 'blur' | string;
}
