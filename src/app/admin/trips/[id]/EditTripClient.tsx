"use client";

import { useState, useEffect } from "react";
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
import { updateTripAction } from "../actions";
import type { TripWithDetails, UpdateTripInput, TripType, TripStatus, Church } from "@/lib/types/sunday-school";

interface EditTripClientProps {
  trip: TripWithDetails;
  userProfile: any;
  churches: Church[];
  dioceses: Array<{ id: string; name: string }>;
}

interface Destination {
  destination_name: string;
  description: string;
  visit_order: number;
}

export default function EditTripClient({ trip, userProfile, churches, dioceses }: EditTripClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [churchIds, setChurchIds] = useState<string[]>([]);
  const [dioceseIds, setDioceseIds] = useState<string[]>([]);

  // Filter churches based on selected dioceses
  const filteredChurches = dioceseIds.length > 0
    ? churches.filter(church => dioceseIds.includes(church.diocese_id || ""))
    : churches;

  // Format datetime for input (datetime-local format)
  const formatDateTimeLocal = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<Partial<UpdateTripInput>>({
    id: trip.id,
    title: trip.title,
    description: trip.description || "",
    start_datetime: formatDateTimeLocal(trip.start_datetime),
    end_datetime: formatDateTimeLocal(trip.end_datetime),
    trip_type: trip.trip_type || "event",
    status: trip.status || "active",
    available: trip.available ?? true,
    price_normal: trip.price_normal || 0,
    price_mastor: trip.price_mastor || 0,
    price_botl: trip.price_botl || 0,
    max_participants: trip.max_participants || undefined,
    requires_parent_approval: trip.requires_parent_approval ?? true,
    transportation_details: trip.transportation_details || "",
    what_to_bring: trip.what_to_bring || "",
  });

  // Initialize destinations, churches, and dioceses from trip data
  useEffect(() => {
    if (trip.destinations && trip.destinations.length > 0) {
      setDestinations(
        trip.destinations.map((dest) => ({
          destination_name: dest.destination_name,
          description: dest.description || "",
          visit_order: dest.visit_order,
        }))
      );
    }
    if (trip.churches && trip.churches.length > 0) {
      setChurchIds(trip.churches.map(c => c.church_id));
    }
    if (trip.dioceses && trip.dioceses.length > 0) {
      setDioceseIds(trip.dioceses.map(d => d.diocese_id));
    }
  }, [trip]);

  function handleInputChange(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleChurchChange(churchId: string, checked: boolean) {
    if (checked) {
      setChurchIds([...churchIds, churchId]);
    } else {
      setChurchIds(churchIds.filter(id => id !== churchId));
    }
  }

  function handleDioceseChange(dioceseId: string, checked: boolean) {
    if (checked) {
      setDioceseIds([...dioceseIds, dioceseId]);
      const churchesInDiocese = churches.filter(c => c.diocese_id === dioceseId).map(c => c.id);
      setChurchIds(prev => [...prev, ...churchesInDiocese.filter(id => !prev.includes(id))]);
    } else {
      setDioceseIds(dioceseIds.filter(id => id !== dioceseId));
      const churchesInDiocese = churches.filter(c => c.diocese_id === dioceseId).map(c => c.id);
      setChurchIds(prev => prev.filter(id => !churchesInDiocese.includes(id)));
    }
  }

  function addDestination() {
    setDestinations([
      ...destinations,
      {
        destination_name: "",
        description: "",
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

    if (!formData.title || !formData.start_datetime || !formData.end_datetime || !formData.trip_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await updateTripAction({
        ...formData,
        church_ids: churchIds.length > 0 ? churchIds : undefined,
        diocese_ids: dioceseIds.length > 0 ? dioceseIds : undefined,
        destinations: destinations.map((d) => ({
          destination_name: d.destination_name,
          description: d.description || undefined,
          visit_order: d.visit_order,
        })),
      } as UpdateTripInput);
      toast.success("Trip updated successfully");
      router.push("/admin/trips");
    } catch (error: any) {
      console.error("Error updating trip:", error);
      toast.error(error.message || "Failed to update trip");
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
          <h1 className="text-3xl font-bold">Edit Trip</h1>
          <p className="text-muted-foreground mt-1">
            Update trip details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Same structure as CreateTripClient */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="started">Started</SelectItem>
                        <SelectItem value="ended">Ended</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                        <SelectItem value="soldout">Sold Out</SelectItem>
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
                <div>
                  <Label htmlFor="start_datetime">Start Date & Time *</Label>
                  <Input
                    id="start_datetime"
                    type="datetime-local"
                    value={formData.start_datetime}
                    onChange={(e) => handleInputChange("start_datetime", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_datetime">End Date & Time *</Label>
                  <Input
                    id="end_datetime"
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) => handleInputChange("end_datetime", e.target.value)}
                    required
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
                        <Label>Destination Name *</Label>
                        <Input
                          value={dest.destination_name}
                          onChange={(e) => updateDestination(index, "destination_name", e.target.value)}
                          placeholder="Enter destination name"
                          required
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={dest.description}
                          onChange={(e) => updateDestination(index, "description", e.target.value)}
                          placeholder="Enter destination description"
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Available</Label>
                  <Switch
                    id="available"
                    checked={formData.available ?? true}
                    onCheckedChange={(checked) => handleInputChange("available", checked)}
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
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="price_normal">Normal Price *</Label>
                  <Input
                    id="price_normal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_normal || 0}
                    onChange={(e) => handleInputChange("price_normal", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price_mastor">Mastor Price *</Label>
                  <Input
                    id="price_mastor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_mastor || 0}
                    onChange={(e) => handleInputChange("price_mastor", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price_botl">Botl Price *</Label>
                  <Input
                    id="price_botl"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_botl || 0}
                    onChange={(e) => handleInputChange("price_botl", parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Church & Diocese Selection */}
            {(userProfile.role === "super_admin" || userProfile.role === "diocese_admin") && (
              <>
                {/* Diocese Selection */}
                {userProfile.role === "super_admin" && dioceses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Available in Dioceses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded p-2 max-h-40 overflow-y-auto">
                        {dioceses.map((diocese) => (
                          <label key={diocese.id} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={dioceseIds.includes(diocese.id)}
                              onChange={(e) => handleDioceseChange(diocese.id, e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">{diocese.name}</span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Church Selection */}
                {churches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Available in Churches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded p-2 max-h-40 overflow-y-auto">
                        {filteredChurches.map((church) => (
                          <label key={church.id} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={churchIds.includes(church.id)}
                              onChange={(e) => handleChurchChange(church.id, e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">
                              {church.name}
                              {church.diocese_id && ` - ${dioceses.find(d => d.id === church.diocese_id)?.name || ''}`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Updating..." : "Update Trip"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
