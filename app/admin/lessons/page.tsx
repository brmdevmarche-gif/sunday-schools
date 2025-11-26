"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimpleButton } from "@/components/ui/simple-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Clock,
  Church,
  GraduationCap,
  User,
  Search,
  CheckCircle,
  Circle,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Lesson, Church as ChurchType, ClassGroup } from "@/lib/types";

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
  const [classGroups, setClassGroups] = useState<
    { id: number; name: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [churchFilter, setChurchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch lessons with church and class group information
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(
          `
          *,
          church (
            id,
            name
          ),
          class_group (
            id,
            name
          ),
          teacher_servant (
            id,
            first_name,
            last_name
          )
        `
        )
        .order("lesson_date", { ascending: false });

      if (lessonsError) throw lessonsError;

      // Fetch churches for filtering
      const { data: churchesData, error: churchesError } = await supabase
        .from("churches")
        .select("id, name")
        .order("name");

      if (churchesError) throw churchesError;

      // Fetch class groups for filtering
      const { data: classGroupsData, error: classGroupsError } = await supabase
        .from("class_groups")
        .select("id, name")
        .order("name");

      if (classGroupsError) throw classGroupsError;

      setLessons(lessonsData || []);
      setChurches(churchesData || []);
      setClassGroups(classGroupsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lesson?")) return;

    try {
      const { error } = await supabase.from("lessons").delete().eq("id", id);
      if (error) throw error;

      setLessons((prev) => prev.filter((lesson) => lesson.id !== id));
    } catch (error) {
      console.error("Error deleting lesson:", error);
      alert("Error deleting lesson. Please try again.");
    }
  };

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lesson.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (lesson.church?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (lesson.class_group?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesChurch =
      churchFilter === "all" || lesson.church_id.toString() === churchFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && lesson.is_completed) ||
      (statusFilter === "pending" && !lesson.is_completed);

    return matchesSearch && matchesChurch && matchesStatus;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "No date set";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lessons</h1>
          <p className="text-muted-foreground mt-1">
            Manage lesson plans and teaching materials
          </p>
        </div>
        <Link href="/lessons/new">
          <SimpleButton>
            <Plus className="w-4 h-4 mr-2" />
            Add Lesson
          </SimpleButton>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={churchFilter} onValueChange={setChurchFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by church" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Churches</SelectItem>
            {churches.map((church) => (
              <SelectItem key={church.id} value={church.id.toString()}>
                {church.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lessons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Lessons ({filteredLessons.length})
          </CardTitle>
          <CardDescription>
            All lesson plans and teaching materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading lessons...</div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No lessons found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || churchFilter !== "all" || statusFilter !== "all"
                  ? "No lessons match your search criteria."
                  : "Get started by adding your first lesson."}
              </p>
              {!searchTerm &&
                churchFilter === "all" &&
                statusFilter === "all" && (
                  <Link href="/lessons/new">
                    <SimpleButton>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lesson
                    </SimpleButton>
                  </Link>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Class Group</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{lesson.title}</div>
                            {lesson.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {lesson.description.length > 50
                                  ? `${lesson.description.substring(0, 50)}...`
                                  : lesson.description}
                              </div>
                            )}
                            {lesson.scripture_reference && (
                              <div className="text-xs text-blue-600 mt-1">
                                📖 {lesson.scripture_reference}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lesson.church ? (
                          <div className="flex items-center gap-1">
                            <Church className="w-4 h-4 text-muted-foreground" />
                            {lesson.church.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lesson.class_group ? (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            {lesson.class_group.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No class
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lesson.teacher_servant ? (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {lesson.teacher_servant.first_name}{" "}
                            {lesson.teacher_servant.last_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No teacher
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(lesson.lesson_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lesson.duration_minutes ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {lesson.duration_minutes} min
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No duration
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lesson.is_completed ? "default" : "secondary"
                          }
                          className={
                            lesson.is_completed
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {lesson.is_completed ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/lessons/${lesson.id}/edit`}>
                            <SimpleButton variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </SimpleButton>
                          </Link>
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(lesson.id)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </SimpleButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
