"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2, MapPin } from "lucide-react";
import { createTripAction } from "../actions";
import type { CreateTripInput, TripType, TripStatus, Church } from "@/lib/types/sunday-school";

interface CreateTripClientProps {
  userProfile: any;
  churches: Church[];
}

interface Destination {
  location_name: string;
  location_address: string;
  location_description: string;
  visit_order: number;
}

export default function CreateTripClient({ userProfile, churches }: CreateTripClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  const [formData, setFormData] = useState<Partial<CreateTripInput>>({
    church_id: userProfile.church_id || "",
    title: "",
    description: "",
    trip_date: "",
    trip_time: "",
    duration_hours: undefined,
    time_to_go: "",
    time_to_back: "",
    trip_type: "event" as TripType,
    status: "opened" as TripStatus,
    cost: undefined,
    max_participants: undefined,
    requires_parent_approval: true,
    transportation_details: "",
    what_to_bring: "",
    is_published: false,
  });

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function addDestination() {
    setDestinations([
      ...destinations,
      {
        location_name: "",
        location_address: "",
        location_description: "",
        visit_order: destinations.length + 1,
      },
    ]);
  }

  function removeDestination(index: number) {
    setDestinations(destinations.filter((_, i) => i !== index).map((d, i) => ({ ...d, visit_order: i + 1 })));
  }

  function updateDestination(index: number, field: keyof Destination, value: string) {
    const updated = [...destinations];
    updated[index] = { ...updated[index], [field]: value };
    setDestinations(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title || !formData.trip_date || !formData.church_id || !formData.trip_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate destinations if any are added
    for (const dest of destinations) {
      if (!dest.location_name.trim()) {
        toast.error("All destinations must have a location name");
        return;
      }
    }

    setIsLoading(true);
    try {
      await createTripAction({
        ...formData,
        destinations: destinations.map((d) => ({
          location_name: d.location_name,
          location_address: d.location_address || undefined,
          location_description: d.location_description || undefined,
          visit_order: d.visit_order,
        })),
      } as CreateTripInput);
      toast.success("Trip created successfully");
      router.push("/admin/trips");
    } catch (error: any) {
      console.error("Error creating trip:", error);
      toast.error(error.message || "Failed to create trip");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Trip</h1>
          <p className="text-muted-foreground mt-1">
            Create a new trip for your church
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="church_id">Church *</Label>
                  <Select
                    value={formData.church_id}
                    onValueChange={(value) => handleInputChange("church_id", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a church" />
                    </SelectTrigger>
                    <SelectContent>
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter trip title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Enter trip description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trip_type">Trip Type *</Label>
                    <Select
                      value={formData.trip_type}
                      onValueChange={(value) => handleInputChange("trip_type", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="funny">Funny</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opened">Opened</SelectItem>
                        <SelectItem value="coming_soon">Coming Soon</SelectItem>
                        <SelectItem value="started">Started</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trip_date">Trip Date *</Label>
                    <Input
                      id="trip_date"
                      type="date"
                      value={formData.trip_date}
                      onChange={(e) => handleInputChange("trip_date", e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="trip_time">Trip Time</Label>
                    <Input
                      id="trip_time"
                      type="time"
                      value={formData.trip_time}
                      onChange={(e) => handleInputChange("trip_time", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time_to_go">Time to Go</Label>
                    <Input
                      id="time_to_go"
                      type="time"
                      value={formData.time_to_go}
                      onChange={(e) => handleInputChange("time_to_go", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="time_to_back">Time to Back</Label>
                    <Input
                      id="time_to_back"
                      type="time"
                      value={formData.time_to_back}
                      onChange={(e) => handleInputChange("time_to_back", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration_hours">Duration (hours)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    min="0"
                    value={formData.duration_hours || ""}
                    onChange={(e) => handleInputChange("duration_hours", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Destinations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Destinations</CardTitle>
                <Button type="button" onClick={addDestination} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Destination
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {destinations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No destinations added. Click "Add Destination" to add one.
                  </p>
                ) : (
                  destinations.map((dest, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Destination {index + 1}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDestination(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <Label>Location Name *</Label>
                        <Input
                          value={dest.location_name}
                          onChange={(e) => updateDestination(index, "location_name", e.target.value)}
                          placeholder="Enter location name"
                          required
                        />
                      </div>
                      <div>
                        <Label>Location Address</Label>
                        <Input
                          value={dest.location_address}
                          onChange={(e) => updateDestination(index, "location_address", e.target.value)}
                          placeholder="Enter location address"
                        />
                      </div>
                      <div>
                        <Label>Location Description</Label>
                        <Textarea
                          value={dest.location_description}
                          onChange={(e) => updateDestination(index, "location_description", e.target.value)}
                          placeholder="Enter location description"
                          rows={2}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="transportation_details">Transportation Details</Label>
                  <Textarea
                    id="transportation_details"
                    value={formData.transportation_details || ""}
                    onChange={(e) => handleInputChange("transportation_details", e.target.value)}
                    placeholder="Enter transportation details"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="what_to_bring">What to Bring</Label>
                  <Textarea
                    id="what_to_bring"
                    value={formData.what_to_bring || ""}
                    onChange={(e) => handleInputChange("what_to_bring", e.target.value)}
                    placeholder="Enter what participants should bring"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cost">Cost</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost || ""}
                    onChange={(e) => handleInputChange("cost", e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    value={formData.max_participants || ""}
                    onChange={(e) => handleInputChange("max_participants", e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requires_parent_approval">Requires Parent Approval</Label>
                  <Switch
                    id="requires_parent_approval"
                    checked={formData.requires_parent_approval || false}
                    onCheckedChange={(checked) => handleInputChange("requires_parent_approval", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_published">Published</Label>
                  <Switch
                    id="is_published"
                    checked={formData.is_published || false}
                    onCheckedChange={(checked) => handleInputChange("is_published", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Creating..." : "Create Trip"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

