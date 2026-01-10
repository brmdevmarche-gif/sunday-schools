"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  BadgeDefinition,
  UserBadgeWithDetails,
  UserStreak,
  StreakType,
  LeaderboardFilters,
  LeaderboardResponse,
  LeaderboardEntry,
  GamificationProfile,
  BadgeAwardResult,
  StreakUpdateResult,
  ActionResult,
} from "@/lib/types";

// =====================================================
// BADGE ACTIONS
// =====================================================

/**
 * Get all available badge definitions
 */
export async function getBadgeDefinitionsAction(): Promise<
  ActionResult<BadgeDefinition[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("badge_definitions")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("rarity", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}

/**
 * Get user's earned badges
 */
export async function getUserBadgesAction(
  userId?: string
): Promise<ActionResult<UserBadgeWithDetails[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const targetUserId = userId || user.id;

  const { data, error } = await supabase
    .from("user_badges")
    .select(
      `
      *,
      badge:badge_definitions(*)
    `
    )
    .eq("user_id", targetUserId)
    .order("earned_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data as UserBadgeWithDetails[]) || [] };
}

/**
 * Check and award badges based on criteria
 */
export async function checkAndAwardBadgesAction(
  userId: string
): Promise<ActionResult<BadgeAwardResult[]>> {
  const adminClient = createAdminClient();

  // Get user's current stats in parallel
  const [
    pointsResult,
    readingsResult,
    spiritualResult,
    competitionsResult,
    existingBadges,
    streaksResult,
  ] = await Promise.all([
    adminClient
      .from("student_points_balance")
      .select("total_earned")
      .eq("user_id", userId)
      .single(),
    adminClient
      .from("user_readings")
      .select("id", { count: "exact" })
      .eq("user_id", userId),
    adminClient
      .from("spiritual_notes")
      .select("activity_type", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "approved"),
    adminClient
      .from("competition_submissions")
      .select("ranking, id")
      .eq("user_id", userId),
    adminClient.from("user_badges").select("badge_id").eq("user_id", userId),
    adminClient.from("user_streaks").select("*").eq("user_id", userId),
  ]);

  const totalPoints = pointsResult.data?.total_earned || 0;
  const readingsCount = readingsResult.count || 0;
  const spiritualCount = spiritualResult.count || 0;
  const competitionCount = competitionsResult.data?.length || 0;
  const earnedBadgeIds = new Set(
    (existingBadges.data || []).map((b) => b.badge_id)
  );

  // Calculate streaks
  const streaks = (streaksResult.data || []).reduce(
    (acc, s) => {
      acc[s.streak_type] = s.current_streak;
      return acc;
    },
    {} as Record<string, number>
  );

  // Get unique spiritual activity types
  const { data: spiritualTypes } = await adminClient
    .from("spiritual_notes")
    .select("activity_type")
    .eq("user_id", userId)
    .eq("status", "approved");

  const uniqueSpiritualTypes = new Set(
    (spiritualTypes || []).map((s) => s.activity_type)
  ).size;

  // Competition stats
  const competitionRankings = competitionsResult.data || [];
  const firstPlaceWins = competitionRankings.filter(
    (c) => c.ranking === 1
  ).length;
  const podiumFinishes = competitionRankings.filter(
    (c) => c.ranking && c.ranking <= 3
  ).length;

  // Get all badge definitions
  const { data: badges } = await adminClient
    .from("badge_definitions")
    .select("*")
    .eq("is_active", true);

  const awardedBadges: BadgeAwardResult[] = [];

  for (const badge of badges || []) {
    if (earnedBadgeIds.has(badge.id)) continue;

    const criteria = badge.criteria as any;
    let qualified = false;

    switch (criteria.type) {
      case "streak":
        const maxStreak = Math.max(
          streaks["reading"] || 0,
          streaks["spiritual_notes"] || 0,
          streaks["combined"] || 0
        );
        qualified = maxStreak >= (criteria.min_days || 0);
        break;

      case "points":
        qualified = totalPoints >= (criteria.min_points || 0);
        break;

      case "reading_count":
        qualified = readingsCount >= (criteria.min_count || 0);
        break;

      case "spiritual_count":
        qualified = spiritualCount >= (criteria.min_count || 0);
        break;

      case "spiritual_diversity":
        qualified = uniqueSpiritualTypes >= (criteria.min_types || 0);
        break;

      case "competition_rank":
        if (criteria.rank === 1) {
          qualified = firstPlaceWins > 0;
        } else if (criteria.rank === 3) {
          qualified = podiumFinishes > 0;
        }
        break;

      case "competition_wins":
        qualified = firstPlaceWins >= (criteria.count || 0);
        break;

      case "competition_participation":
        qualified = competitionCount >= (criteria.count || 0);
        break;

      case "attendance_streak":
        const attendanceStreak = streaks["attendance"] || 0;
        qualified = attendanceStreak >= (criteria.min_days || 0);
        break;

      // Manual awards are handled separately
      case "manual_award":
      case "attendance_perfect_month":
      case "group_activity":
        // These require admin action or special triggers
        break;
    }

    if (qualified) {
      // Award the badge
      const { error } = await adminClient.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });

      if (!error) {
        // Award points if badge has reward
        if (badge.points_reward > 0) {
          await adminClient.rpc("add_points", {
            p_user_id: userId,
            p_points: badge.points_reward,
            p_transaction_type: "activity_completion",
            p_notes: `Badge earned: ${badge.name}`,
          });
        }

        awardedBadges.push({
          badge,
          points_awarded: badge.points_reward,
          is_new: true,
        });
      }
    }
  }

  if (awardedBadges.length > 0) {
    revalidatePath("/dashboard");
    revalidatePath("/gamification");
  }

  return { success: true, data: awardedBadges };
}

/**
 * Manually award a badge to a user (admin only)
 */
export async function awardBadgeManuallyAction(
  userId: string,
  badgeCode: string,
  notes?: string
): Promise<ActionResult<BadgeAwardResult>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check if user is admin
  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !currentUser ||
    !["super_admin", "diocese_admin", "church_admin", "teacher"].includes(
      currentUser.role
    )
  ) {
    return { success: false, error: "Not authorized" };
  }

  const adminClient = createAdminClient();

  // Get badge by code
  const { data: badge, error: badgeError } = await adminClient
    .from("badge_definitions")
    .select("*")
    .eq("code", badgeCode)
    .single();

  if (badgeError || !badge) {
    return { success: false, error: "Badge not found" };
  }

  // Check if already earned
  const { data: existing } = await adminClient
    .from("user_badges")
    .select("id")
    .eq("user_id", userId)
    .eq("badge_id", badge.id)
    .single();

  if (existing) {
    return { success: false, error: "Badge already earned" };
  }

  // Award the badge
  const { error } = await adminClient.from("user_badges").insert({
    user_id: userId,
    badge_id: badge.id,
    awarded_by: user.id,
    award_notes: notes,
  });

  if (error) return { success: false, error: error.message };

  // Award points if badge has reward
  if (badge.points_reward > 0) {
    await adminClient.rpc("add_points", {
      p_user_id: userId,
      p_points: badge.points_reward,
      p_transaction_type: "activity_completion",
      p_notes: `Badge awarded by admin: ${badge.name}`,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/gamification");

  return {
    success: true,
    data: {
      badge,
      points_awarded: badge.points_reward,
      is_new: true,
    },
  };
}

// =====================================================
// STREAK ACTIONS
// =====================================================

/**
 * Get user's streaks
 */
export async function getUserStreaksAction(
  userId?: string
): Promise<ActionResult<UserStreak[]>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const targetUserId = userId || user.id;

  const { data, error } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", targetUserId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data as UserStreak[]) || [] };
}

/**
 * Update streak for a user (called after activity completion)
 */
export async function updateStreakAction(
  userId: string,
  streakType: StreakType
): Promise<ActionResult<StreakUpdateResult>> {
  const adminClient = createAdminClient();

  const today = new Date().toISOString().split("T")[0];

  // Get current streak record
  const { data: existing } = await adminClient
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("streak_type", streakType)
    .single();

  let previousStreak = existing?.current_streak || 0;
  let newStreak = 1;
  let longestStreak = existing?.longest_streak || 0;

  if (existing?.last_activity_date) {
    const lastDate = new Date(existing.last_activity_date);
    const todayDate = new Date(today);
    const diffDays = Math.floor(
      (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Same day, no change
      newStreak = previousStreak;
    } else if (diffDays === 1) {
      // Consecutive day, increment
      newStreak = previousStreak + 1;
    }
    // else: Gap > 1 day, streak resets to 1
  }

  longestStreak = Math.max(longestStreak, newStreak);

  // Upsert streak record
  const { error } = await adminClient.from("user_streaks").upsert(
    {
      user_id: userId,
      streak_type: streakType,
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity_date: today,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,streak_type",
    }
  );

  if (error) return { success: false, error: error.message };

  // Also update combined streak
  if (streakType !== "combined") {
    await updateCombinedStreakAction(userId);
  }

  // Check for streak badges
  const { data: badgesEarned } = await checkAndAwardBadgesAction(userId);

  return {
    success: true,
    data: {
      previous_streak: previousStreak,
      new_streak: newStreak,
      longest_streak: longestStreak,
      badges_earned: badgesEarned || [],
    },
  };
}

/**
 * Calculate combined streak (any activity)
 */
async function updateCombinedStreakAction(userId: string): Promise<void> {
  const adminClient = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  // Get dates from both activities
  const [readingDates, spiritualDates] = await Promise.all([
    adminClient
      .from("user_readings")
      .select("completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false }),
    adminClient
      .from("spiritual_notes")
      .select("activity_date")
      .eq("user_id", userId)
      .eq("status", "approved")
      .order("activity_date", { ascending: false }),
  ]);

  // Combine and dedupe dates
  const allDates = new Set([
    ...(readingDates.data || []).map((r) => r.completed_at?.split("T")[0]),
    ...(spiritualDates.data || []).map((s) => s.activity_date),
  ]);

  const sortedDates = Array.from(allDates)
    .filter(Boolean)
    .sort((a, b) => b!.localeCompare(a!));

  // Calculate streak
  let streak = 0;
  const todayMs = new Date(today).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;

  if (sortedDates.length > 0) {
    const firstDate = new Date(sortedDates[0]!).getTime();
    if (firstDate === todayMs || firstDate === todayMs - msPerDay) {
      let expectedDate = firstDate;
      for (const dateStr of sortedDates) {
        const dateMs = new Date(dateStr!).getTime();
        if (dateMs === expectedDate) {
          streak++;
          expectedDate -= msPerDay;
        } else {
          break;
        }
      }
    }
  }

  // Get existing for longest streak
  const { data: existing } = await adminClient
    .from("user_streaks")
    .select("longest_streak")
    .eq("user_id", userId)
    .eq("streak_type", "combined")
    .single();

  const longestStreak = Math.max(existing?.longest_streak || 0, streak);

  await adminClient.from("user_streaks").upsert(
    {
      user_id: userId,
      streak_type: "combined",
      current_streak: streak,
      longest_streak: longestStreak,
      last_activity_date: sortedDates[0] || null,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,streak_type",
    }
  );
}

// =====================================================
// LEADERBOARD ACTIONS
// =====================================================

/**
 * Get leaderboard data
 */
export async function getLeaderboardAction(
  filters: LeaderboardFilters
): Promise<ActionResult<LeaderboardResponse>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const adminClient = createAdminClient();
  const limit = filters.limit || 50;

  // Get user IDs based on scope
  let userIds: string[] | null = null;

  if (filters.scope !== "global" && filters.scope_id) {
    switch (filters.scope) {
      case "class":
        const { data: classUsers } = await adminClient
          .from("class_assignments")
          .select("user_id")
          .eq("class_id", filters.scope_id)
          .eq("assignment_type", "student")
          .eq("is_active", true);
        userIds = classUsers?.map((u) => u.user_id) || [];
        break;

      case "church":
        const { data: churchUsers } = await adminClient
          .from("users")
          .select("id")
          .eq("church_id", filters.scope_id);
        userIds = churchUsers?.map((u) => u.id) || [];
        break;

      case "diocese":
        const { data: dioceseUsers } = await adminClient
          .from("users")
          .select("id")
          .eq("diocese_id", filters.scope_id);
        userIds = dioceseUsers?.map((u) => u.id) || [];
        break;
    }
  }

  // Build query
  let query = adminClient
    .from("student_points_balance")
    .select(
      `
      user_id,
      total_earned,
      available_points,
      user:users!student_points_balance_user_id_fkey(
        id,
        full_name,
        avatar_url
      )
    `
    )
    .order("total_earned", { ascending: false })
    .limit(limit);

  if (userIds && userIds.length > 0) {
    query = query.in("user_id", userIds);
  } else if (userIds && userIds.length === 0) {
    // No users in scope
    return {
      success: true,
      data: {
        entries: [],
        user_rank: null,
        total_participants: 0,
        period: filters.period,
        cached_at: new Date().toISOString(),
      },
    };
  }

  const { data: balances, error } = await query;

  if (error) return { success: false, error: error.message };

  // Map to leaderboard entries
  const entries: LeaderboardEntry[] = (balances || []).map(
    (b: any, index: number) => ({
      user_id: b.user_id,
      rank: index + 1,
      points: b.total_earned || 0,
      name: b.user?.full_name || "Unknown",
      avatar_url: b.user?.avatar_url,
    })
  );

  // Find current user's rank
  let userRank = entries.find((e) => e.user_id === user.id) || null;

  // If user not in top list, get their rank separately
  if (!userRank) {
    const { data: userBalance } = await adminClient
      .from("student_points_balance")
      .select("total_earned")
      .eq("user_id", user.id)
      .single();

    if (userBalance) {
      const { count } = await adminClient
        .from("student_points_balance")
        .select("user_id", { count: "exact", head: true })
        .gt("total_earned", userBalance.total_earned);

      userRank = {
        user_id: user.id,
        rank: (count || 0) + 1,
        points: userBalance.total_earned || 0,
        name: "You",
      };
    }
  }

  return {
    success: true,
    data: {
      entries,
      user_rank: userRank,
      total_participants: entries.length,
      period: filters.period,
      cached_at: new Date().toISOString(),
    },
  };
}

// =====================================================
// GAMIFICATION PROFILE
// =====================================================

/**
 * Get complete gamification profile for a user
 */
export async function getGamificationProfileAction(
  userId?: string
): Promise<ActionResult<GamificationProfile>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const targetUserId = userId || user.id;
  const adminClient = createAdminClient();

  // Parallel fetch all data
  const [balanceResult, badgesResult, streaksResult] = await Promise.all([
    adminClient
      .from("student_points_balance")
      .select("*")
      .eq("user_id", targetUserId)
      .single(),
    adminClient
      .from("user_badges")
      .select("*, badge:badge_definitions(*)")
      .eq("user_id", targetUserId)
      .order("earned_at", { ascending: false }),
    adminClient.from("user_streaks").select("*").eq("user_id", targetUserId),
  ]);

  const streaksMap = (streaksResult.data || []).reduce(
    (acc, s) => {
      acc[s.streak_type] = s.current_streak;
      return acc;
    },
    {} as Record<string, number>
  );

  const longestStreak = Math.max(
    ...(streaksResult.data || []).map((s) => s.longest_streak),
    0
  );

  return {
    success: true,
    data: {
      user_id: targetUserId,
      total_points: balanceResult.data?.total_earned || 0,
      available_points: balanceResult.data?.available_points || 0,
      badges: (badgesResult.data as UserBadgeWithDetails[]) || [],
      badges_count: badgesResult.data?.length || 0,
      streaks: {
        reading: streaksMap["reading"] || 0,
        spiritual: streaksMap["spiritual_notes"] || 0,
        attendance: streaksMap["attendance"] || 0,
        combined: streaksMap["combined"] || 0,
      },
      longest_streak: longestStreak,
    },
  };
}
