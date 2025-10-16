export interface Organization {
  id: number;
  name: string;
  profile: Buffer | null;
  created_at: string; // ISO timestamp
}

export interface UserOrganization {
  id: number;
  user_id: string;
  organization_id: number;
  role: string;
  created_at: string; // ISO timestamp
}
