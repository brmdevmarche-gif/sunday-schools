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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SimpleDialogTrigger } from "@/components/ui/simple-dialog";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { Student, Church, ClassGroup } from "@/lib/types";

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    church_id: "",
    class_group_id: "",
    date_of_birth: "",
    gender: "",
    address: "",
    parent_name: "",
    parent_phone: "",
    parent_email: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    allergies: "",
    notes: "",
  });

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

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      church_id: "",
      class_group_id: "",
      date_of_birth: "",
      gender: "",
      address: "",
      parent_name: "",
      parent_phone: "",
      parent_email: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      medical_conditions: "",
      allergies: "",
      notes: "",
    });
  };

  const handleAdd = async () => {
    try {
      const { data, error } = await supabase.from("students").insert([
        {
          church_id: Number.parseInt(formData.church_id),
          class_group_id: formData.class_group_id
            ? Number.parseInt(formData.class_group_id)
            : null,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          address: formData.address,
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          medical_conditions: formData.medical_conditions,
          allergies: formData.allergies,
          enrollment_date: new Date().toISOString().split("T")[0],
          is_active: true,
          notes: formData.notes,
        },
      ]).select(`
          *,
          church:churches (id, name, diocese_id),
          class_group:class_groups (*)
        `);

      if (error) throw error;

      if (data) {
        setStudents([...students, ...data]);
      }
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      church_id: student.church_id.toString(),
      class_group_id: student.class_group_id?.toString() || "",
      date_of_birth: student.date_of_birth || "",
      gender: student.gender || "",
      address: student.address || "",
      parent_name: student.parent_name || "",
      parent_phone: student.parent_phone || "",
      parent_email: student.parent_email || "",
      emergency_contact_name: student.emergency_contact_name || "",
      emergency_contact_phone: student.emergency_contact_phone || "",
      medical_conditions: student.medical_conditions || "",
      allergies: student.allergies || "",
      notes: student.notes || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingStudent) return;

    try {
      const { data, error } = await supabase
        .from("students")
        .update({
          church_id: Number.parseInt(formData.church_id),
          class_group_id: formData.class_group_id
            ? Number.parseInt(formData.class_group_id)
            : null,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          address: formData.address,
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          emergency_contact_name: formData.emergency_contact_name,
          emergency_contact_phone: formData.emergency_contact_phone,
          medical_conditions: formData.medical_conditions,
          allergies: formData.allergies,
          notes: formData.notes,
        })
        .eq("id", editingStudent.id).select(`
          *,
          church:churches (id, name, diocese_id),
          class_group:class_groups (*)
        `);

      if (error) throw error;

      if (data) {
        setStudents(
          students.map((s) => (s.id === editingStudent.id ? data[0] : s))
        );
      }
      setEditingStudent(null);
      resetForm();
    } catch (error) {
      console.error("Error updating student:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);

      if (error) throw error;

      setStudents(students.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.church?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChurch =
      selectedChurch === "all" ||
      student.church_id.toString() === selectedChurch;

    const matchesClass =
      selectedClass === "all" ||
      student.class_group_id?.toString() === selectedClass;

    return matchesSearch && matchesChurch && matchesClass;
  });

  const availableClassGroups = classGroups.filter(
    (cg) =>
      formData.church_id === "" ||
      cg.church_id.toString() === formData.church_id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Loading Students...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we fetch the data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Student Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage student enrollment, information, and class assignments.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SimpleDialogTrigger>
            <SimpleButton className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </SimpleButton>
          </SimpleDialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>
                Enter the student information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="church">Church</Label>
                <Select
                  value={formData.church_id}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      church_id: value,
                      class_group_id: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select church" />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.id.toString()}>
                        {church.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class_group">Class Group</Label>
                <Select
                  value={formData.class_group_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, class_group_id: value })
                  }
                  disabled={!formData.church_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class group" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClassGroups.map((classGroup) => (
                      <SelectItem
                        key={classGroup.id}
                        value={classGroup.id.toString()}
                      >
                        {classGroup.name} ({classGroup.age_range})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_birth: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter student address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_name">Parent/Guardian Name</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_name: e.target.value })
                  }
                  placeholder="Enter parent/guardian name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_phone">Parent/Guardian Phone</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_phone: e.target.value })
                  }
                  placeholder="+20-xxx-xxx-xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent_email">Parent/Guardian Email</Label>
                <Input
                  id="parent_email"
                  type="email"
                  value={formData.parent_email}
                  onChange={(e) =>
                    setFormData({ ...formData, parent_email: e.target.value })
                  }
                  placeholder="parent@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergency_contact_name: e.target.value,
                    })
                  }
                  placeholder="Enter emergency contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emergency_contact_phone: e.target.value,
                    })
                  }
                  placeholder="+20-xxx-xxx-xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medical_conditions">Medical Conditions</Label>
                <Input
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medical_conditions: e.target.value,
                    })
                  }
                  placeholder="Enter any medical conditions"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) =>
                    setFormData({ ...formData, allergies: e.target.value })
                  }
                  placeholder="Enter any allergies"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes about the student"
                />
              </div>
            </div>
            <DialogFooter>
              <SimpleButton
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </SimpleButton>
              <SimpleButton
                onClick={handleAdd}
                disabled={
                  !formData.first_name ||
                  !formData.last_name ||
                  !formData.church_id
                }
              >
                Add Student
              </SimpleButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-muted/50"
          />
        </div>
        <Select value={selectedChurch} onValueChange={setSelectedChurch}>
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
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by class" />
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
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">
                {filteredStudents.length} Students
              </span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                {filteredStudents.filter((s) => s.is_active).length} Active
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            All registered students in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Church & Class</TableHead>
                <TableHead>Parent/Guardian</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Health Info</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-accent" />
                      <div>
                        <div className="font-medium">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {student.date_of_birth && (
                            <>
                              <Calendar className="w-3 h-3" />
                              Age {calculateAge(student.date_of_birth)} •{" "}
                              {student.gender}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline">{student.church?.name}</Badge>
                      {student.class_group && (
                        <div className="text-sm text-muted-foreground">
                          {student.class_group.name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {student.parent_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {student.parent_email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {student.parent_email}
                        </div>
                      )}
                      {student.parent_phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {student.parent_phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {student.medical_notes &&
                      student.medical_notes !== "None" ? (
                        <div className="flex items-center gap-1 text-sm text-orange-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Has conditions</span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No conditions
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog
                        open={editingStudent?.id === student.id}
                        onOpenChange={(open) =>
                          !open && setEditingStudent(null)
                        }
                      >
                        <SimpleDialogTrigger>
                          <SimpleButton
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(student)}
                          >
                            <Edit className="w-4 h-4" />
                          </SimpleButton>
                        </SimpleDialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Student</DialogTitle>
                            <DialogDescription>
                              Update the student information below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-first_name">
                                First Name
                              </Label>
                              <Input
                                id="edit-first_name"
                                value={formData.first_name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    first_name: e.target.value,
                                  })
                                }
                                placeholder="Enter first name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-last_name">Last Name</Label>
                              <Input
                                id="edit-last_name"
                                value={formData.last_name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    last_name: e.target.value,
                                  })
                                }
                                placeholder="Enter last name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-church">Church</Label>
                              <Select
                                value={formData.church_id}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    church_id: value,
                                    class_group_id: "",
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select church" />
                                </SelectTrigger>
                                <SelectContent>
                                  {churches.map((church) => (
                                    <SelectItem
                                      key={church.id}
                                      value={church.id.toString()}
                                    >
                                      {church.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-class_group">
                                Class Group
                              </Label>
                              <Select
                                value={formData.class_group_id}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    class_group_id: value,
                                  })
                                }
                                disabled={!formData.church_id}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class group" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableClassGroups.map((classGroup) => (
                                    <SelectItem
                                      key={classGroup.id}
                                      value={classGroup.id.toString()}
                                    >
                                      {classGroup.name} ({classGroup.age_range})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-date_of_birth">
                                Date of Birth
                              </Label>
                              <Input
                                id="edit-date_of_birth"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    date_of_birth: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-gender">Gender</Label>
                              <Select
                                value={formData.gender}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, gender: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-address">Address</Label>
                              <Textarea
                                id="edit-address"
                                value={formData.address}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    address: e.target.value,
                                  })
                                }
                                placeholder="Enter student address"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-parent_name">
                                Parent/Guardian Name
                              </Label>
                              <Input
                                id="edit-parent_name"
                                value={formData.parent_name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    parent_name: e.target.value,
                                  })
                                }
                                placeholder="Enter parent/guardian name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-parent_phone">
                                Parent/Guardian Phone
                              </Label>
                              <Input
                                id="edit-parent_phone"
                                value={formData.parent_phone}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    parent_phone: e.target.value,
                                  })
                                }
                                placeholder="+20-xxx-xxx-xxxx"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-parent_email">
                                Parent/Guardian Email
                              </Label>
                              <Input
                                id="edit-parent_email"
                                type="email"
                                value={formData.parent_email}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    parent_email: e.target.value,
                                  })
                                }
                                placeholder="parent@example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-emergency_name">
                                Emergency Contact Name
                              </Label>
                              <Input
                                id="edit-emergency_name"
                                value={formData.emergency_contact_name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    emergency_contact_name: e.target.value,
                                  })
                                }
                                placeholder="Enter emergency contact name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-emergency_phone">
                                Emergency Contact Phone
                              </Label>
                              <Input
                                id="edit-emergency_phone"
                                value={formData.emergency_contact_phone}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    emergency_contact_phone: e.target.value,
                                  })
                                }
                                placeholder="+20-xxx-xxx-xxxx"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-medical_conditions">
                                Medical Conditions
                              </Label>
                              <Input
                                id="edit-medical_conditions"
                                value={formData.medical_conditions}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    medical_conditions: e.target.value,
                                  })
                                }
                                placeholder="Enter any medical conditions"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-allergies">Allergies</Label>
                              <Input
                                id="edit-allergies"
                                value={formData.allergies}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    allergies: e.target.value,
                                  })
                                }
                                placeholder="Enter any allergies"
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-notes">Notes</Label>
                              <Textarea
                                id="edit-notes"
                                value={formData.notes}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Additional notes about the student"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <SimpleButton
                              variant="outline"
                              onClick={() => setEditingStudent(null)}
                            >
                              Cancel
                            </SimpleButton>
                            <SimpleButton
                              onClick={handleUpdate}
                              disabled={
                                !formData.first_name ||
                                !formData.last_name ||
                                !formData.church_id
                              }
                            >
                              Update Student
                            </SimpleButton>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <SimpleButton
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(student.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </SimpleButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
