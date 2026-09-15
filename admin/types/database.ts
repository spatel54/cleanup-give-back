export type SessionStatus = 'active' | 'under_review' | 'approved' | 'not_approved' | 'invalid';

export type FeedbackRating = 'excited' | 'happy' | 'neutral' | 'sad' | 'very_sad';

export type ShopOrderStatus = 'pending' | 'paid' | 'shipped' | 'fulfilled' | 'delivered' | 'cancelled';

export type ShopOrderFulfillmentMethod = 'usps_ship' | 'office_pickup' | 'local_dropoff';

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          user_id: string;
          activity: string | null;
          court_ordered: boolean;
          description: string | null;
          started_at: string | null;
          ended_at: string | null;
          duration_seconds: number | null;
          distance_miles: number | null;
          route: unknown;
          status: SessionStatus;
          created_at: string;
          adjusted_hours: number | null;
          admin_notes: string | null;
          decline_reason: string | null;
          letterhead_generated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['sessions']['Row']>;
        Update: Partial<Database['public']['Tables']['sessions']['Row']>;
      };
      checkpoints: {
        Row: {
          id: string;
          session_id: string;
          selfie_path: string | null;
          progress_path: string | null;
          captured_at: string | null;
          submitted_early: boolean;
          latitude: number | null;
          longitude: number | null;
        };
        Insert: Partial<Database['public']['Tables']['checkpoints']['Row']>;
        Update: Partial<Database['public']['Tables']['checkpoints']['Row']>;
      };
      volunteer_feedback: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          source: 'session' | 'account';
          rating: FeedbackRating | null;
          comment: string | null;
          flagged: boolean;
          submitted_at: string;
        };
        Insert: Partial<Database['public']['Tables']['volunteer_feedback']['Row']>;
        Update: Partial<Database['public']['Tables']['volunteer_feedback']['Row']>;
      };
      shop_orders: {
        Row: {
          id: string;
          user_id: string | null;
          items: unknown;
          total_cents: number;
          status: ShopOrderStatus;
          fulfillment_method: ShopOrderFulfillmentMethod;
          includes_kit: boolean;
          shipping_address: unknown;
          tracking_number: string | null;
          carrier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['shop_orders']['Row']>;
        Update: Partial<Database['public']['Tables']['shop_orders']['Row']>;
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          starts_at: string;
          ends_at: string | null;
          what_to_bring: string | null;
          organizer: string | null;
          /** Primary/first hero — kept in sync with image_urls[0] for older clients. */
          image_url: string | null;
          /** Full gallery for event registration detail carousel. */
          image_urls: string[];
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['events']['Row']>;
        Update: Partial<Database['public']['Tables']['events']['Row']>;
      };
      court_orders: {
        Row: {
          id: string;
          user_id: string;
          required_hours: number;
          due_date: string | null;
          case_reference: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['court_orders']['Row']>;
        Update: Partial<Database['public']['Tables']['court_orders']['Row']>;
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          target_table: string;
          target_id: string | null;
          before_value: unknown;
          after_value: unknown;
          performed_at: string;
        };
        Insert: Partial<Database['public']['Tables']['admin_audit_log']['Row']>;
        Update: Partial<Database['public']['Tables']['admin_audit_log']['Row']>;
      };
      event_volunteer_notices: {
        Row: {
          event_id: string;
          user_id: string;
          notified_at: string;
        };
        Insert: Partial<Database['public']['Tables']['event_volunteer_notices']['Row']>;
        Update: Partial<Database['public']['Tables']['event_volunteer_notices']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      session_status: SessionStatus;
    };
  };
}

export type Session = Database['public']['Tables']['sessions']['Row'];
export type Checkpoint = Database['public']['Tables']['checkpoints']['Row'];
export type VolunteerFeedback = Database['public']['Tables']['volunteer_feedback']['Row'];
export type ShopOrder = Database['public']['Tables']['shop_orders']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type CourtOrder = Database['public']['Tables']['court_orders']['Row'];
export type AdminAuditLog = Database['public']['Tables']['admin_audit_log']['Row'];
