export interface OutboxEventRecord {
  id: string;
  event_id: string;
  event_type: string;
  event_version: number;
  payload: string;
  trace_id: string;
  status: 'pending' | 'published' | 'failed';
  created_at: string;
  published_at?: string;
  attempts: number;
}
