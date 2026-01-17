// =====================================================
// TRIPS TYPES
// =====================================================
// Trip management, destinations, and participants
// =====================================================

// =====================================================
// TRIP ENUMS
// =====================================================

export type TripType = "one_day" | "spiritual" | "volunteering" | "fun" | "retreat" | "carnival" | "tournament" | "other";
export type TripStatus = "active" | "started" | "ended" | "canceled" | "soldout";
export type TripPaymentStatus = "pending" | "paid" | "partially_paid" | "refunded";
export type TripApprovalStatus = "pending" | "approved" | "rejected";

// =====================================================
// TRIP
// =====================================================

export interface Trip {
  id: string;
  church_id: string | null; // Kept for backward compatibility, use trip_churches instead
  title: string;
  description: string | null;
  destination: string | null; // Kept for backward compatibility, but use destinations array instead
  image_url: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  trip_type: TripType | null;
  status: TripStatus;
  available: boolean;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  max_participants: number | null;
  requires_parent_approval: boolean | null;
  transportation_details: string | null;
  what_to_bring: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

// =====================================================
// TRIP DESTINATIONS
// =====================================================

export interface TripDestination {
  id: string;
  trip_id: string;
  destination_name: string;
  description: string | null;
  visit_order: number;
  created_at: string;
}

// =====================================================
// TRIP ASSOCIATIONS
// =====================================================

export interface TripChurch {
  id: string;
  trip_id: string;
  church_id: string;
  created_at: string;
}

export interface TripDiocese {
  id: string;
  trip_id: string;
  diocese_id: string;
  created_at: string;
}

export interface TripClass {
  id: string;
  trip_id: string;
  class_id: string;
  created_at: string;
}

// =====================================================
// TRIP ORGANIZERS
// =====================================================

export interface TripOrganizer {
  id: string;
  trip_id: string;
  user_id: string;
  can_approve: boolean;
  can_go: boolean;
  can_take_attendance: boolean;
  can_collect_payment: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface TripOrganizerWithUser extends TripOrganizer {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
}

// =====================================================
// TRIP PARTICIPANTS
// =====================================================

export interface TripParticipant {
  id: string;
  trip_id: string;
  user_id: string;
  parent_approval: boolean | null;
  approval_status: TripApprovalStatus;
  payment_status: TripPaymentStatus;
  amount_paid?: number | null;
  approved_at: string | null;
  approved_by: string | null;
  emergency_contact: string | null;
  medical_info: string | null;
  registered_at: string;
  registered_by: string | null;
  attendance_status?: 'present' | 'absent' | 'excused' | 'late' | null;
  attendance_marked_at?: string | null;
  attendance_marked_by?: string | null;
  attendance_notes?: string | null;
}

export interface TripParticipantWithUser extends TripParticipant {
  user: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  registrar?: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
  } | null;
}

// =====================================================
// TRIP WITH DETAILS
// =====================================================

export interface TripWithDetails extends Trip {
  destinations?: TripDestination[];
  churches?: TripChurch[];
  dioceses?: TripDiocese[];
  classes?: TripClass[];
  participants?: TripParticipantWithUser[];
  organizers?: TripOrganizerWithUser[];
  participants_count?: number;
  my_participation?: TripParticipant;
}

// =====================================================
// TRIP INPUT TYPES
// =====================================================

export interface CreateTripInput {
  title: string;
  description?: string;
  image_url?: string;
  start_datetime: string;
  end_datetime: string;
  trip_type: TripType;
  status?: TripStatus;
  available?: boolean;
  price_normal: number;
  price_mastor: number;
  price_botl: number;
  max_participants?: number;
  requires_parent_approval?: boolean;
  transportation_details?: string;
  what_to_bring?: string;
  church_ids?: string[];
  diocese_ids?: string[];
  class_ids?: string[];
  destinations?: Array<{
    destination_name: string;
    description?: string;
    visit_order?: number;
  }>;
}

export interface UpdateTripInput extends Partial<CreateTripInput> {
  id: string;
  church_ids?: string[];
  diocese_ids?: string[];
  class_ids?: string[];
}

export interface SubscribeToTripInput {
  trip_id: string;
  emergency_contact?: string;
  medical_info?: string;
}

export interface UpdateTripParticipantInput {
  participant_id: string;
  approval_status?: TripApprovalStatus;
  payment_status?: TripPaymentStatus;
  amount_paid?: number;
}

// =====================================================
// TRIP ORGANIZER INPUT TYPES
// =====================================================

export interface AddTripOrganizerInput {
  trip_id: string;
  user_id: string;
  can_approve?: boolean;
  can_go?: boolean;
  can_take_attendance?: boolean;
  can_collect_payment?: boolean;
}

export interface UpdateTripOrganizerInput {
  organizer_id: string;
  can_approve?: boolean;
  can_go?: boolean;
  can_take_attendance?: boolean;
  can_collect_payment?: boolean;
}
