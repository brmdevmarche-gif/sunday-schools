// =====================================================
// GAMIFICATION TYPES
// =====================================================

export type BadgeCategory =
  | "streak"
  | "points"
  | "competition"
  | "reading"
  | "spiritual"
  | "attendance"
  | "social"
  | "special";

export type BadgeRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary";

// Badge Criteria Types
export interface BadgeCriteria {
  type:
    | "streak"
    | "points"
    | "competition_rank"
    | "competition_wins"
    | "competition_participation"
    | "reading_count"
    | "spiritual_count"
    | "spiritual_diversity"
    | "attendance_streak"
    | "attendance_perfect_month"
    | "group_activity"
    | "manual_award";
  min_days?: number;
  min_points?: number;
  rank?: number;
  count?: number;
  min_count?: number;
  min_types?: number;
  activity?: "reading" | "spiritual" | "combined";
}

// Badge Definition
export interface BadgeDefinition {
  id: string;
  code: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  icon: string;
  color: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  criteria: BadgeCriteria;
  points_reward: number;
  is_active: boolean;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

// User Badge (earned)
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  awarded_by: string | null;
  award_notes: string | null;
}

export interface UserBadgeWithDetails extends UserBadge {
  badge: BadgeDefinition;
}

// Streak Tracking
export type StreakType = "reading" | "spiritual_notes" | "attendance" | "combined";

export interface UserStreak {
  id: string;
  user_id: string;
  streak_type: StreakType;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

// Leaderboard
export type LeaderboardScope = "global" | "diocese" | "church" | "class";
export type LeaderboardPeriod = "all_time" | "monthly" | "weekly";

export interface LeaderboardEntry {
  user_id: string;
  rank: number;
  points: number;
  name: string;
  avatar_url?: string | null;
  streak?: number;
  badges_count?: number;
}

export interface LeaderboardFilters {
  scope: LeaderboardScope;
  scope_id?: string;
  period: LeaderboardPeriod;
  limit?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  user_rank?: LeaderboardEntry | null;
  total_participants: number;
  period: LeaderboardPeriod;
  cached_at: string;
}

// Gamification Profile (aggregated view)
export interface GamificationProfile {
  user_id: string;
  total_points: number;
  available_points: number;
  badges: UserBadgeWithDetails[];
  badges_count: number;
  streaks: {
    reading: number;
    spiritual: number;
    attendance: number;
    combined: number;
  };
  longest_streak: number;
  class_rank?: number;
  church_rank?: number;
}

// Action Results
export interface BadgeAwardResult {
  badge: BadgeDefinition;
  points_awarded: number;
  is_new: boolean;
}

export interface StreakUpdateResult {
  previous_streak: number;
  new_streak: number;
  longest_streak: number;
  badges_earned: BadgeAwardResult[];
}

// Create/Input types
export interface CreateUserBadgeInput {
  user_id: string;
  badge_id: string;
  awarded_by?: string;
  award_notes?: string;
}
