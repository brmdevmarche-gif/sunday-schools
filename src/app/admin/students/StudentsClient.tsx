"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserPlus, X, Search, Eye } from "lucide-react";
import type {
  UserWithClassAssignments,
  Diocese,
  Church,
  Class,
} from "@/lib/types/sunday-school";
import {
  createStudentAction,
  updateStudentAction,
  deleteStudentAction,
  assignToClassAction,
  removeFromClassAction,
  type CreateStudentInput,
  type UpdateStudentInput,
} from "./actions";

interface StudentsClientProps {
  initialStudents: UserWithClassAssignments[];
  dioceses: Diocese[];
  churches: Church[];
  classes: Class[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function StudentsClient({
  initialStudents,
  dioceses,
  churches,
  classes,
  canCreate,
  canEdit,
  canDelete,
}: StudentsClientProps) {
  const router = useRouter();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UserWithClassAssignments | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<UserWithClassAssignments | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDioceseFilter, setSelectedDioceseFilter] = useState<string>("all");
  const [selectedChurchFilter, setSelectedChurchFilter] = useState<string>("all");

  const [formData, setFormData] = useState<CreateStudentInput>({
    email: "",
    password: "",
    full_name: "",
    diocese_id: "",
    church_id: "",
    date_of_birth: "",
    gender: undefined,
    phone: "",
    address: "",
  });

  const [assignClass, setAssignClass] = useState<string>("");

  function handleOpenDialog(student?: UserWithClassAssignments) {
    if (student) {
      setEditingStudent(student);
      setFormData({
        email: student.email,
        password: "",
        full_name: student.full_name || "",
        diocese_id: student.diocese_id || "",
        church_id: student.church_id || "",
        date_of_birth: student.date_of_birth || "",
        gender: student.gender || undefined,
        phone: student.phone || "",
        address: student.address || "",
      });
    } else {
      setEditingStudent(null);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        diocese_id: "",
        church_id: "",
        date_of_birth: "",
        gender: undefined,
        phone: "",
        address: "",
      });
    }
    setIsDialogOpen(true);
  }

  function handleOpenAssignDialog(student: UserWithClassAssignments) {
    setSelectedStudent(student);
    setAssignClass("");
    setIsAssignDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingStudent) {
        const updateData: UpdateStudentInput = {
          full_name: formData.full_name,
          diocese_id: formData.diocese_id,
          church_id: formData.church_id,
          date_of_birth: formData.date_of_birth || undefined,
          gender: formData.gender,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
        };
        await updateStudentAction(editingStudent.id, updateData);
        toast.success("Student updated successfully");
      } else {
        await createStudentAction(formData);
        toast.success("Student created successfully");
      }

      setIsDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast.error(error.message || "Failed to save student");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(student: UserWithClassAssignments) {
    if (!confirm(`Are you sure you want to delete ${student.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteStudentAction(student.id);
      toast.success("Student deleted successfully");
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast.error(error.message || "Failed to delete student");
    }
  }

  async function handleAssignToClass() {
    if (!selectedStudent || !assignClass) {
      toast.error("Please select a class");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignToClassAction({
        student_id: selectedStudent.id,
        class_id: assignClass,
      });
      toast.success("Student assigned to class successfully");
      setIsAssignDialogOpen(false);
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      console.error("Error assigning student to class:", error);
      toast.error(error.message || "Failed to assign student to class");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemoveFromClass(student: UserWithClassAssignments, classId: string) {
    if (!confirm("Are you sure you want to remove this student from the class?")) {
      return;
    }

    try {
      await removeFromClassAction(student.id, classId);
      toast.success("Student removed from class successfully");
      startTransition(() => {
        router.refresh();
      });
    } catch (error: any) {
      console.error("Error removing student from class:", error);
      toast.error(error.message || "Failed to remove student from class");
    }
  }

  function getDioceseName(dioceseId: string | null): string {
    if (!dioceseId) return "-";
    const diocese = dioceses.find((d) => d.id === dioceseId);
    return diocese?.name || "-";
  }

  function getChurchName(churchId: string | null): string {
    if (!churchId) return "-";
    const church = churches.find((c) => c.id === churchId);
    return church?.name || "-";
  }

  // Filter students
  const filteredStudents = initialStudents.filter((student) => {
    const matchesSearch =
      !searchQuery ||
      student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDiocese =
      selectedDioceseFilter === "all" || student.diocese_id === selectedDioceseFilter;

    const matchesChurch =
      selectedChurchFilter === "all" || student.church_id === selectedChurchFilter;

    return matchesSearch && matchesDiocese && matchesChurch;
  });

  // Filter available classes for assignment (only from student's church)
  const availableClasses = selectedStudent
    ? classes.filter((c) => c.church_id === selectedStudent.church_id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage students, their information, and class assignments
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Diocese</Label>
              <Select
                value={selectedDioceseFilter}
                onValueChange={setSelectedDioceseFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dioceses</SelectItem>
                  {dioceses.map((diocese) => (
                    <SelectItem key={diocese.id} value={diocese.id}>
                      {diocese.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Church</Label>
              <Select
                value={selectedChurchFilter}
                onValueChange={setSelectedChurchFilter}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Churches</SelectItem>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students ({filteredStudents.length})</CardTitle>
          <CardDescription>
            View and manage student information and class assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Diocese</TableHead>
                  <TableHead>Church</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const age = student.date_of_birth
                    ? new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()
                    : null;

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.full_name || "-"}
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{getDioceseName(student.diocese_id)}</TableCell>
                      <TableCell>{getChurchName(student.church_id)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.classAssignments && student.classAssignments.length > 0 ? (
                            student.classAssignments.map((assignment) => (
                              <Badge
                                key={assignment.class_id}
                                variant="secondary"
                                className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleRemoveFromClass(student, assignment.class_id)}
                              >
                                {assignment.class_name}
                                <X className="ml-1 h-3 w-3" />
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No classes</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{age ? `${age} yrs` : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/students/${student.id}`)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenAssignDialog(student)}
                                title="Assign to class"
                              >
                                <UserPlus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(student)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(student)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Edit Student" : "Create Student"}
              </DialogTitle>
              <DialogDescription>
                {editingStudent
                  ? "Update student information"
                  : "Add a new student to the system"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    disabled={isSubmitting || !!editingStudent}
                  />
                </div>
              </div>

              {!editingStudent && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diocese_id">Diocese *</Label>
                  <Select
                    value={formData.diocese_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, diocese_id: value })
                    }
                    required
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select diocese" />
                    </SelectTrigger>
                    <SelectContent>
                      {dioceses.map((diocese) => (
                        <SelectItem key={diocese.id} value={diocese.id}>
                          {diocese.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="church_id">Church *</Label>
                  <Select
                    value={formData.church_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, church_id: value })
                    }
                    required
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select church" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches
                        .filter((c) => c.diocese_id === formData.diocese_id)
                        .map((church) => (
                          <SelectItem key={church.id} value={church.id}>
                            {church.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_birth: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, gender: value })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : editingStudent
                  ? "Update"
                  : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign to Class Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Class</DialogTitle>
            <DialogDescription>
              Assign {selectedStudent?.full_name} to a class
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={assignClass} onValueChange={setAssignClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.map((classItem) => {
                    const alreadyAssigned = selectedStudent?.classAssignments?.some(
                      (a) => a.class_id === classItem.id
                    );
                    return (
                      <SelectItem
                        key={classItem.id}
                        value={classItem.id}
                        disabled={alreadyAssigned}
                      >
                        {classItem.name} {alreadyAssigned && "(Already assigned)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignToClass} disabled={isSubmitting || !assignClass}>
              {isSubmitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
