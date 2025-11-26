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
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  Calendar,
  AlertTriangle,
  GraduationCap,
  Search,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Student, Church, ClassGroup } from "@/lib/types";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students with church and class group information
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(
          `
          *,
          church:churches (id, name, diocese_id),
          class_group:class_groups (*)
        `
        )
        .order("first_name");

      if (studentsError) throw studentsError;

      // Fetch churches
      const { data: churchesData, error: churchesError } = await supabase
        .from("churches")
        .select("*")
        .order("name");

      if (churchesError) throw churchesError;

      // Fetch class groups
      const { data: classGroupsData, error: classGroupsError } = await supabase
        .from("class_groups")
        .select("*")
        .order("name");

      if (classGroupsError) throw classGroupsError;

      setStudents(studentsData || []);
      setChurches(churchesData || []);
      setClassGroups(classGroupsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;

      setStudents((prev) => prev.filter((student) => student.id !== id));
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Error deleting student. Please try again.");
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.parent_guardian_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesChurch =
      selectedChurch === "all" ||
      student.church_id?.toString() === selectedChurch;
    const matchesClass =
      selectedClass === "all" ||
      student.class_group_id?.toString() === selectedClass;

    return matchesSearch && matchesChurch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Students</h1>
          <p className="text-muted-foreground mt-1">
            Manage students across all churches and classes
          </p>
        </div>
        <Link href="/students/new">
          <SimpleButton>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </SimpleButton>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedChurch} onValueChange={setSelectedChurch}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Churches" />
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
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classGroups.map((classGroup) => (
              <SelectItem key={classGroup.id} value={classGroup.id.toString()}>
                {classGroup.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Students ({filteredStudents.length})
          </CardTitle>
          <CardDescription>All students in your system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No students found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ||
                selectedChurch !== "all" ||
                selectedClass !== "all"
                  ? "No students match your search criteria."
                  : "Get started by adding your first student."}
              </p>
              {!searchTerm &&
                selectedChurch === "all" &&
                selectedClass === "all" && (
                  <Link href="/students/new">
                    <SimpleButton>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </SimpleButton>
                  </Link>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent/Guardian</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.gender || "Not specified"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.date_of_birth ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {calculateAge(student.date_of_birth)} years
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.church ? (
                          <Badge variant="outline">{student.church.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            No church
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.class_group ? (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3 text-muted-foreground" />
                            {student.class_group.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No class
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.parent_guardian_name ? (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {student.parent_guardian_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not provided
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {student.parent_guardian_phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {student.parent_guardian_phone}
                            </div>
                          )}
                          {student.parent_guardian_email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {student.parent_guardian_email}
                            </div>
                          )}
                          {!student.parent_guardian_phone &&
                            !student.parent_guardian_email && (
                              <span className="text-muted-foreground text-sm">
                                No contact
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              student.is_active ? "default" : "secondary"
                            }
                          >
                            {student.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {(student.medical_conditions ||
                            student.allergies) && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/students/${student.id}/edit`}>
                            <SimpleButton variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </SimpleButton>
                          </Link>
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(student.id)}
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
