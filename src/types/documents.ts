export interface Document {
  id: number;
  name: string;
  content: string | null;
  owner_id: string;
  updated_at: string; // ISO timestamp
  created_at: string; // ISO timestamp
  url: string; // UUID
  organization_id: number | null;
}

export interface DocumentRole {
  id: number;
  document_id: number;
  user_id: string;
  role: string;
}
