
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
import { ArrowLeft, Church, Save, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { Diocese } from "@/lib/types";

export default function NewChurchPage() {
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDioceses, setLoadingDioceses] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    diocese_id: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    priest_name: "",
    established_date: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    fetchDioceses();
  }, []);

  const fetchDioceses = async () => {
    try {
      setLoadingDioceses(true);
      const { data, error } = await supabase
        .from("diocese")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setDioceses(data || []);
    } catch (error) {
      console.error("Error fetching dioceses:", error);
    } finally {
      setLoadingDioceses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter a church name");
      return;
    }

    try {
      setLoading(true);

      const churchData: any = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        priest_name: formData.priest_name.trim() || null,
        established_date: formData.established_date || null,
        diocese_id: formData.diocese_id ? parseInt(formData.diocese_id) : null,
      };

      // Add coordinates if provided
      if (formData.latitude && formData.longitude) {
        churchData.latitude = parseFloat(formData.latitude);
        churchData.longitude = parseFloat(formData.longitude);
      }

      const { error } = await supabase.from("churches").insert(churchData);

      if (error) throw error;

      router.push("/churches");
    } catch (error) {
      console.error("Error creating church:", error);
      alert("Error creating church. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/churches">
          <SimpleButton variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Churches
          </SimpleButton>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Add New Church</h1>
          <p className="text-muted-foreground mt-1">
            Create a new church in your diocese system
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-4xl bg-accent-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="w-5 h-5" />
            Church Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Church Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="St. Mark's Church"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diocese_id">Diocese</Label>
                <Select
                  value={formData.diocese_id}
                  onValueChange={(value) =>
                    handleInputChange("diocese_id", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingDioceses ? "Loading..." : "Select diocese"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {dioceses.map((diocese) => (
                      <SelectItem
                        key={diocese.id}
                        value={diocese.id.toString()}
                      >
                        {diocese.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="123 Church Street, City, State, ZIP"
                rows={3}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    handleInputChange("contact_email", e.target.value)
                  }
                  placeholder="contact@church.org"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    handleInputChange("contact_phone", e.target.value)
                  }
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Priest Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priest_name">Priest Name</Label>
                <Input
                  id="priest_name"
                  value={formData.priest_name}
                  onChange={(e) =>
                    handleInputChange("priest_name", e.target.value)
                  }
                  placeholder="Father John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="established_date">Established Date</Label>
                <Input
                  id="established_date"
                  type="date"
                  value={formData.established_date}
                  onChange={(e) =>
                    handleInputChange("established_date", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Location Coordinates */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base font-medium">
                  Geographic Coordinates (Optional)
                </Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      handleInputChange("latitude", e.target.value)
                    }
                    placeholder="40.7128"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      handleInputChange("longitude", e.target.value)
                    }
                    placeholder="-74.0060"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Adding coordinates will enable map features for this church.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4">
              <SimpleButton type="submit" disabled={loading}>
                {loading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Church
                  </>
                )}
              </SimpleButton>
              <Link href="/churches">
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
