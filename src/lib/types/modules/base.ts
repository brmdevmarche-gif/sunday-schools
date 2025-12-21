// =====================================================
// BASE TYPES
// =====================================================
// Core types used across the application
// =====================================================

export type UserRole =
  | "super_admin"
  | "diocese_admin"
  | "church_admin"
  | "class_admin"
  | "teacher_admin"
  | "teacher"
  | "parent"
  | "student"
  | "assistant"
  | "guest"
  | "priest"
  | "store_manager"
  | "activity_coordinator"
  | "trip_coordinator"
  | "volunteer";

export type Gender = "male" | "female";

export type RelationshipType = "parent" | "guardian";

export type AssignmentType = "teacher" | "student" | "assistant";

export type ActivityType = "game" | "craft" | "worship" | "service" | "other";

export type StudentCase = "normal" | "mastor" | "botl";

export type StockType = "on_demand" | "quantity";

export type PriceTier = "normal" | "mastor" | "botl";
