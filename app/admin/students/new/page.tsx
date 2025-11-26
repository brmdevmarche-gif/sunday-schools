
"use client";

import { useState, useEffect } from "react";
import { SimpleButton } from "@/components/ui/simple-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Users,
  Save,
  User,
  Heart,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Church, ClassGroup } from "@/lib/types";

export default function NewStudentPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    church_id: "",
    class_group_id: "",
    date_of_birth: "",
    gender: "",
    year_type: "",
    address: "",
    area_id: "",
    parent_guardian_name: "",
    parent_guardian_phone: "",
    parent_guardian_email: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    allergies: "",
    notes: "",
    image_url: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);

      const [churchesResult, classGroupsResult] = await Promise.all([
        supabase
          .from("churches")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("class_groups")
          .select("*")
          .order("name", { ascending: true }),
      ]);

      if (churchesResult.error) throw churchesResult.error;
      if (classGroupsResult.error) throw classGroupsResult.error;

      setChurches(churchesResult.data || []);
      setClassGroups(classGroupsResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      alert("Please enter the student's first and last name");
      return;
    }

    if (!formData.church_id) {
      alert("Please select a church");
      return;
    }

    try {
      setLoading(true);

      const studentData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        church_id: parseInt(formData.church_id),
        class_group_id: formData.class_group_id
          ? parseInt(formData.class_group_id)
          : null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        year_type: formData.year_type || null,
        address: formData.address.trim() || null,
        area_id: formData.area_id ? parseInt(formData.area_id) : null,
        parent_guardian_name: formData.parent_guardian_name.trim() || null,
        parent_guardian_phone: formData.parent_guardian_phone.trim() || null,
        parent_guardian_email: formData.parent_guardian_email.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone:
          formData.emergency_contact_phone.trim() || null,
        medical_conditions: formData.medical_conditions.trim() || null,
        allergies: formData.allergies.trim() || null,
        notes: formData.notes.trim() || null,
        image_url: formData.image_url.trim() || null,
        enrollment_date: new Date().toISOString().split("T")[0],
        is_active: true,
      };

      const { error } = await supabase.from("students").insert(studentData);

      if (error) throw error;

      router.push("/students");
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Error creating student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Filter class groups by selected church
  const filteredClassGroups = classGroups.filter(
    (group) =>
      !formData.church_id || group.church_id.toString() === formData.church_id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/students">
          <SimpleButton variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Students
          </SimpleButton>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Add New Student
          </h1>
          <p className="text-muted-foreground mt-1">
            Register a new student in your Knesty system
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Student Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <User className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    placeholder="John"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    placeholder="Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      handleInputChange("date_of_birth", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleInputChange("gender", value)
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

                <div className="space-y-2">
                  <Label htmlFor="year_type">Year Type</Label>
                  <Select
                    value={formData.year_type}
                    onValueChange={(value) =>
                      handleInputChange("year_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                      <SelectItem value="Elementary">Elementary</SelectItem>
                      <SelectItem value="Middle">Middle School</SelectItem>
                      <SelectItem value="High">High School</SelectItem>
                      <SelectItem value="Youth">Youth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Profile Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) =>
                      handleInputChange("image_url", e.target.value)
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Church & Class Assignment */}
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" />
                Church & Class Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="church_id">Church *</Label>
                  <Select
                    value={formData.church_id}
                    onValueChange={(value) => {
                      handleInputChange("church_id", value);
                      // Reset class group when church changes
                      handleInputChange("class_group_id", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingData ? "Loading..." : "Select church"
                        }
                      />
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
                  <Label htmlFor="class_group_id">Class Group</Label>
                  <Select
                    value={formData.class_group_id}
                    onValueChange={(value) =>
                      handleInputChange("class_group_id", value)
                    }
                    disabled={!formData.church_id}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          !formData.church_id
                            ? "Select church first"
                            : filteredClassGroups.length === 0
                            ? "No classes available"
                            : "Select class group"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClassGroups.map((classGroup) => (
                        <SelectItem
                          key={classGroup.id}
                          value={classGroup.id.toString()}
                        >
                          {classGroup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="123 Main Street, City, State, ZIP"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Parent/Guardian Information */}
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5" />
                Parent/Guardian Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_guardian_name">
                    Parent/Guardian Name
                  </Label>
                  <Input
                    id="parent_guardian_name"
                    value={formData.parent_guardian_name}
                    onChange={(e) =>
                      handleInputChange("parent_guardian_name", e.target.value)
                    }
                    placeholder="Jane Smith"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_guardian_phone">Parent Phone</Label>
                  <Input
                    id="parent_guardian_phone"
                    value={formData.parent_guardian_phone}
                    onChange={(e) =>
                      handleInputChange("parent_guardian_phone", e.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent_guardian_email">Parent Email</Label>
                  <Input
                    id="parent_guardian_email"
                    type="email"
                    value={formData.parent_guardian_email}
                    onChange={(e) =>
                      handleInputChange("parent_guardian_email", e.target.value)
                    }
                    placeholder="parent@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">
                    Emergency Contact Name
                  </Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) =>
                      handleInputChange(
                        "emergency_contact_name",
                        e.target.value
                      )
                    }
                    placeholder="Emergency contact"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">
                    Emergency Contact Phone
                  </Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) =>
                      handleInputChange(
                        "emergency_contact_phone",
                        e.target.value
                      )
                    }
                    placeholder="+1 (555) 987-6543"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Medical & Additional Information */}
            <div>
              <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" />
                Medical & Additional Information
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Textarea
                    id="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={(e) =>
                      handleInputChange("medical_conditions", e.target.value)
                    }
                    placeholder="Any medical conditions, medications, or health concerns"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) =>
                      handleInputChange("allergies", e.target.value)
                    }
                    placeholder="Food allergies, environmental allergies, etc."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any additional notes about the student"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <SimpleButton type="submit" disabled={loading}>
                {loading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Student
                  </>
                )}
              </SimpleButton>
              <Link href="/students">
                <SimpleButton type="button" variant="outline">
                  Cancel
                </SimpleButton>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
