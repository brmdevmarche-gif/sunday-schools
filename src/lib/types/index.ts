// =====================================================
// TYPES INDEX
// =====================================================
// Central export point for all type modules
// This file maintains backward compatibility while allowing
// modular imports from specific files
// =====================================================

// Re-export all types from modules
export * from './modules/base';
export * from './modules/organizational';
export * from './modules/users';
export * from './modules/trips';
export * from './modules/store';
export * from './modules/activities';
export * from './modules/attendance';
export * from './modules/points';
export * from './modules/announcements';
export * from './modules/enhanced-activities';
export * from './modules/gamification';
export * from './modules/parents';

// =====================================================
// USAGE EXAMPLES:
// =====================================================
//
// Option 1: Import from main index (backward compatible)
// import type { Trip, TripType, Church } from '@/lib/types'
//
// Option 2: Import from specific module
// import type { Trip, TripType } from '@/lib/types/modules/trips'
// import type { Church } from '@/lib/types/modules/organizational'
//
// =====================================================
