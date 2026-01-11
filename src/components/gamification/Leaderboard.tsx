"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award, Flame, Coins, TrendingUp } from "lucide-react";
import { getLeaderboardAction } from "@/app/gamification/actions";
import type {
  LeaderboardEntry,
  LeaderboardFilters,
  LeaderboardPeriod,
  LeaderboardScope,
  LeaderboardResponse,
} from "@/lib/types";

interface LeaderboardProps {
  initialScope?: LeaderboardScope;
  scopeId?: string;
  initialPeriod?: LeaderboardPeriod;
  showFilters?: boolean;
  limit?: number;
  highlightUserId?: string;
  className?: string;
}

export default function Leaderboard({
  initialScope = "class",
  scopeId,
  initialPeriod = "all_time",
  showFilters = true,
  limit = 10,
  highlightUserId,
  className,
}: LeaderboardProps) {
  const t = useTranslations("gamification");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [scope, setScope] = useState<LeaderboardScope>(initialScope);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const filters: LeaderboardFilters = {
        scope,
        scope_id: scopeId,
        period,
        limit,
      };
      const result = await getLeaderboardAction(filters);
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, period, scopeId, limit]);

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800">
            <Medal className="h-5 w-5 text-gray-400" />
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8">
            <span className="text-lg font-medium text-muted-foreground">
              {rank}
            </span>
          </div>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t("leaderboard.title")}
          </CardTitle>

          {showFilters && (
            <div className="flex gap-2">
              <Select
                value={scope}
                onValueChange={(v) => setScope(v as LeaderboardScope)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">
                    {t("leaderboard.scope.class")}
                  </SelectItem>
                  <SelectItem value="church">
                    {t("leaderboard.scope.church")}
                  </SelectItem>
                  <SelectItem value="diocese">
                    {t("leaderboard.scope.diocese")}
                  </SelectItem>
                  <SelectItem value="global">
                    {t("leaderboard.scope.global")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">
                    {t("leaderboard.period.weekly")}
                  </SelectItem>
                  <SelectItem value="monthly">
                    {t("leaderboard.period.monthly")}
                  </SelectItem>
                  <SelectItem value="all_time">
                    {t("leaderboard.period.allTime")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!data || data.entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("leaderboard.empty")}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t("leaderboard.rank")}</TableHead>
                  <TableHead>{t("leaderboard.student")}</TableHead>
                  <TableHead className="text-right">{t("leaderboard.points")}</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    {t("leaderboard.streak")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.entries.map((entry) => (
                  <TableRow
                    key={entry.user_id}
                    className={cn(
                      highlightUserId === entry.user_id &&
                        "bg-primary/5 border-l-2 border-l-primary"
                    )}
                  >
                    <TableCell>{getRankDisplay(entry.rank)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {entry.avatar_url && (
                            <AvatarImage src={entry.avatar_url} alt={entry.name} />
                          )}
                          <AvatarFallback className="text-xs">
                            {getInitials(entry.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "font-medium",
                            highlightUserId === entry.user_id && "text-primary"
                          )}
                        >
                          {entry.name}
                          {highlightUserId === entry.user_id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {t("leaderboard.you")}
                            </Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{entry.points}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {entry.streak !== undefined && entry.streak > 0 && (
                        <div className="flex items-center justify-end gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span>{entry.streak}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* User's rank if not in top list */}
            {data.user_rank &&
              !data.entries.some((e) => e.user_id === data.user_rank?.user_id) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("leaderboard.yourRank")}
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border">
                    <div className="flex items-center gap-3">
                      {getRankDisplay(data.user_rank.rank)}
                      <span className="font-medium">{data.user_rank.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">{data.user_rank.points}</span>
                      </div>
                      {data.user_rank.streak !== undefined && data.user_rank.streak > 0 && (
                        <div className="flex items-center gap-1">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span>{data.user_rank.streak}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Summary */}
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground text-center">
              {t("leaderboard.totalParticipants")}: {data.total_participants}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Compact leaderboard for widgets
export function LeaderboardMini({
  entries,
  highlightUserId,
  className,
}: {
  entries: LeaderboardEntry[];
  highlightUserId?: string;
  className?: string;
}) {
  const t = useTranslations("gamification");

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {entries.slice(0, 5).map((entry) => (
        <div
          key={entry.user_id}
          className={cn(
            "flex items-center justify-between p-2 rounded-lg",
            highlightUserId === entry.user_id ? "bg-primary/10" : "bg-muted/50"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 flex justify-center">{getRankIcon(entry.rank)}</div>
            <span
              className={cn(
                "text-sm truncate max-w-[120px]",
                highlightUserId === entry.user_id && "font-medium"
              )}
            >
              {entry.name}
            </span>
          </div>
          <span className="text-sm font-medium">{entry.points} pts</span>
        </div>
      ))}
    </div>
  );
}
