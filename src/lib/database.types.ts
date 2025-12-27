export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          role: 'manager' | 'technician';
          team_id: string | null;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'manager' | 'technician';
          team_id?: string | null;
          full_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'manager' | 'technician';
          team_id?: string | null;
          full_name?: string;
          created_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          description: string;
          assigned_team_id: string | null;
          is_scrapped: boolean;
          warranty_expiry: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          assigned_team_id?: string | null;
          is_scrapped?: boolean;
          warranty_expiry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          assigned_team_id?: string | null;
          is_scrapped?: boolean;
          warranty_expiry?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          equipment_id: string;
          team_id: string | null;
          type: 'Corrective' | 'Preventive';
          status: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
          duration_hours: number | null;
          scheduled_date: string | null;
          title: string;
          description: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          equipment_id: string;
          team_id?: string | null;
          type: 'Corrective' | 'Preventive';
          status?: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
          duration_hours?: number | null;
          scheduled_date?: string | null;
          title: string;
          description?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          equipment_id?: string;
          team_id?: string | null;
          type?: 'Corrective' | 'Preventive';
          status?: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
          duration_hours?: number | null;
          scheduled_date?: string | null;
          title?: string;
          description?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
