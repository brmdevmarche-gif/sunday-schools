
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
  UserCheck,
  Save,
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Church } from "@/lib/types";

export default function NewServantPage() {
  const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    church_id: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    role: "",
    specialization: "",
    start_date: "",
    is_active: true,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
  });

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await supabase
        .from("churches")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setChurches(data || []);
    } catch (error) {
      console.error("Error fetching churches:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.church_id) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from("servants").insert([
        {
          ...formData,
          church_id: parseInt(formData.church_id),
        },
      ]);

      if (error) throw error;

      router.push("/servants");
    } catch (error) {
      console.error("Error creating servant:", error);
      alert("Error creating servant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const serviceRoles = [
    "Teacher",
    "Assistant Teacher",
    "Class Coordinator",
    "Music Leader",
    "Activity Leader",
    "Administrator",
    "Technical Support",
    "Youth Leader",
    "Children's Ministry Leader",
    "Special Needs Support",
    "Other",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/servants">
          <SimpleButton variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Servants
          </SimpleButton>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Add New Servant
          </h1>
          <p className="text-muted-foreground mt-1">
            Register a new servant for ministry service
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Servant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
                <User className="w-4 h-4" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name" className="text-foreground">
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      handleInputChange("first_name", e.target.value)
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-foreground">
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      handleInputChange("last_name", e.target.value)
                    }
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth" className="text-foreground">
                    Date of Birth
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      handleInputChange("date_of_birth", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="church_id" className="text-foreground">
                    Church *
                  </Label>
                  <Select
                    value={formData.church_id}
                    onValueChange={(value) =>
                      handleInputChange("church_id", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a church" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingData ? (
                        <SelectItem value="" disabled>
                          Loading churches...
                        </SelectItem>
                      ) : (
                        churches.map((church) => (
                          <SelectItem
                            key={church.id}
                            value={church.id.toString()}
                          >
                            {church.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="address" className="text-foreground">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Full address"
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
                <Phone className="w-4 h-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="servant@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-foreground">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Ministry Information */}
            <div>
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4" />
                Ministry Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role" className="text-foreground">
                    Service Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start_date" className="text-foreground">
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      handleInputChange("start_date", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label htmlFor="specialization" className="text-foreground">
                  Specialization/Skills
                </Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) =>
                    handleInputChange("specialization", e.target.value)
                  }
                  placeholder="e.g., Music, Teaching, Administration"
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="emergency_contact_name"
                    className="text-foreground"
                  >
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
                    placeholder="Full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="emergency_contact_phone"
                    className="text-foreground"
                  >
                    Emergency Contact Phone
                  </Label>
                  <Input
                    id="emergency_contact_phone"
                    type="tel"
                    value={formData.emergency_contact_phone}
                    onChange={(e) =>
                      handleInputChange(
                        "emergency_contact_phone",
                        e.target.value
                      )
                    }
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Notes */}
            <div>
              <Label htmlFor="notes" className="text-foreground">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any additional information or special notes"
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6">
              <Link href="/servants">
                <SimpleButton variant="outline" type="button">
                  Cancel
                </SimpleButton>
              </Link>
              <SimpleButton type="submit" disabled={loading}>
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Servant
                  </>
                )}
              </SimpleButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
