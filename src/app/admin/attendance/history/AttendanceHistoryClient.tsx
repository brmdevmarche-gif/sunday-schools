"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { getClassAttendanceAction } from "../actions";
import type { AttendanceStatus } from "@/lib/types/sunday-school";

interface ClassInfo {
  id: string;
  name: string;
  churches: { name: string } | null;
}

interface AttendanceHistoryClientProps {
  classes: ClassInfo[];
  userRole: string;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  notes: string | null;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export default function AttendanceHistoryClient({ classes, userRole }: AttendanceHistoryClientProps) {
  const t = useTranslations();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Set default start date to 30 days ago
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

  async function loadHistory() {
    if (!selectedClassId) {
      toast.error(t("attendance.selectClassFirst"));
      return;
    }

    setIsLoading(true);
    try {
      // Fetch attendance for each date in the range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const allRecords: AttendanceRecord[] = [];

      for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
        const dateString = date.toISOString().split("T")[0];
        const result = await getClassAttendanceAction(selectedClassId, dateString);

        if (result.success && result.data) {
          allRecords.push(...(result.data as AttendanceRecord[]));
        }
      }

      setRecords(allRecords);
    } catch (error) {
      console.error("Error loading attendance history:", error);
      toast.error(t("attendance.failedToLoadHistory"));
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRecords = records.filter((record) => {
    const matchesSearch = searchTerm
      ? (record.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         record.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      : true;

    const matchesStatus = statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: filteredRecords.length,
    present: filteredRecords.filter(r => r.status === "present").length,
    absent: filteredRecords.filter(r => r.status === "absent").length,
    excused: filteredRecords.filter(r => r.status === "excused").length,
    late: filteredRecords.filter(r => r.status === "late").length,
  };

  function getStatusBadge(status: AttendanceStatus) {
    const variants = {
      present: { className: "bg-green-500", text: t("attendance.present") },
      absent: { className: "bg-red-500", text: t("attendance.absent") },
      excused: { className: "bg-yellow-500", text: t("attendance.excused") },
      late: { className: "bg-orange-500", text: t("attendance.late") },
    };

    const variant = variants[status];
    return <Badge className={variant.className}>{variant.text}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("attendance.history")}</h1>
        <p className="text-muted-foreground mt-2">{t("attendance.historyDescription")}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("attendance.filters")}
          </CardTitle>
          <CardDescription>{t("attendance.filtersDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("classes.class")}</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("attendance.selectClass")} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.churches && `- ${cls.churches.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("attendance.startDate")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("attendance.endDate")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("attendance.searchStudent")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={t("attendance.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("attendance.filterByStatus")}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("attendance.allStatuses")}</SelectItem>
                  <SelectItem value="present">{t("attendance.present")}</SelectItem>
                  <SelectItem value="absent">{t("attendance.absent")}</SelectItem>
                  <SelectItem value="excused">{t("attendance.excused")}</SelectItem>
                  <SelectItem value="late">{t("attendance.late")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={loadHistory} disabled={!selectedClassId || isLoading} className="gap-2">
            <Calendar className="h-4 w-4" />
            {isLoading ? t("common.loading") : t("attendance.loadHistory")}
          </Button>
        </CardContent>
      </Card>

      {/* Statistics */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("attendance.statistics")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Badge variant="outline">{t("attendance.totalRecords")}: {stats.total}</Badge>
              <Badge className="bg-green-500">{t("attendance.present")}: {stats.present}</Badge>
              <Badge variant="destructive">{t("attendance.absent")}: {stats.absent}</Badge>
              <Badge className="bg-yellow-500">{t("attendance.excused")}: {stats.excused}</Badge>
              <Badge className="bg-orange-500">{t("attendance.late")}: {stats.late}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Records Table */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("attendance.records")}</CardTitle>
                <CardDescription>
                  {t("attendance.showingRecords", { count: filteredRecords.length })}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                {t("common.export")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("students.student")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>{t("attendance.status")}</TableHead>
                    <TableHead>{t("attendance.notes")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        {t("attendance.noRecordsFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{record.user.full_name || record.user.email}</p>
                            <p className="text-sm text-muted-foreground">{record.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(record.attendance_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {records.length === 0 && !isLoading && selectedClassId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("attendance.noHistoryFound")}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
