"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Coins, Trophy, Medal, Award } from "lucide-react";
import { getClassPointsOverviewAction } from "@/app/admin/points/actions";
import PointsAdjustmentDialog from "./PointsAdjustmentDialog";

interface ClassPointsOverviewProps {
  classId: string;
}

interface StudentPoints {
  userId: string;
  fullName: string;
  availablePoints: number;
  totalEarned: number;
}

export default function ClassPointsOverview({ classId }: ClassPointsOverviewProps) {
  const t = useTranslations("points");
  const [students, setStudents] = useState<StudentPoints[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPoints = async () => {
    try {
      const data = await getClassPointsOverviewAction(classId);
      // Sort by total earned descending
      const sorted = data.sort((a, b) => b.totalEarned - a.totalEarned);
      setStudents(sorted);
    } catch (error) {
      console.error("Failed to fetch class points:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, [classId]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-medium">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          {t("classPoints")}
        </CardTitle>
        <CardDescription>{t("classPointsDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t("noPointsData")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("rank")}</TableHead>
                <TableHead>{t("student")}</TableHead>
                <TableHead className="text-right">{t("availablePoints")}</TableHead>
                <TableHead className="text-right">{t("totalEarned")}</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student, index) => {
                const rank = index + 1;
                return (
                  <TableRow key={student.userId}>
                    <TableCell className="text-center">
                      {getRankIcon(rank)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.fullName}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={student.availablePoints > 0 ? "default" : "secondary"}
                        className="gap-1"
                      >
                        <Coins className="h-3 w-3" />
                        {student.availablePoints}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">
                        {student.totalEarned}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <PointsAdjustmentDialog
                        studentId={student.userId}
                        studentName={student.fullName}
                        currentPoints={student.availablePoints}
                        onSuccess={fetchPoints}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Summary */}
        {students.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between text-sm text-muted-foreground">
            <span>
              Total Students: <strong>{students.length}</strong>
            </span>
            <span>
              Total Points Earned:{" "}
              <strong>
                {students.reduce((sum, s) => sum + s.totalEarned, 0)}
              </strong>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
