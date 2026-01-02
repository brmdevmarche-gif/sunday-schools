"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { createTripAction, getClassesForChurches } from "../actions";
import TripImageUpload from "@/components/trips/TripImageUpload";
import type {
  CreateTripInput,
  TripType,
  TripStatus,
  Church,
  ExtendedUser,
} from "@/lib/types";

interface CreateTripClientProps {
  userProfile: ExtendedUser;
  churches: Church[];
  dioceses: Array<{ id: string; name: string }>;
}

interface Destination {
  destination_name: string;
  description: string;
  visit_order: number;
}

interface ClassItem {
  id: string;
  name: string;
  church_id: string;
}

export default function CreateTripClient({
  userProfile,
  churches,
  dioceses,
}: CreateTripClientProps) {
  const router = useRouter();
  const t = useTranslations("trips");
  const [isLoading, setIsLoading] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [churchIds, setChurchIds] = useState<string[]>([]);
  const [dioceseIds, setDioceseIds] = useState<string[]>([]);
  const [classIds, setClassIds] = useState<string[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  // Filter churches based on selected dioceses
  const filteredChurches =
    dioceseIds.length > 0
      ? churches.filter((church) =>
          dioceseIds.includes(church.diocese_id || "")
        )
      : churches;

  // Fetch classes when churches are selected
  useEffect(() => {
    async function fetchClasses() {
      if (churchIds.length === 0) {
        setAvailableClasses([]);
        setClassIds([]);
        return;
      }

      setIsLoadingClasses(true);
      try {
        const classes = await getClassesForChurches(churchIds);
        setAvailableClasses(classes);
        // Remove class IDs that are no longer in available classes
        setClassIds((prev) =>
          prev.filter((id) => classes.some((c) => c.id === id))
        );
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to fetch classes");
      } finally {
        setIsLoadingClasses(false);
      }
    }

    fetchClasses();
  }, [churchIds]);

  const [formData, setFormData] = useState<Partial<CreateTripInput>>({
    title: "",
    description: "",
    image_url: "",
    start_datetime: "",
    end_datetime: "",
    trip_type: "one_day" as TripType,
    status: "active" as TripStatus,
    available: true,
    price_normal: 0,
    price_mastor: 0,
    price_botl: 0,
    max_participants: undefined,
    requires_parent_approval: true,
    transportation_details: "",
    what_to_bring: "",
  });

  function handleInputChange(field: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleChurchChange(churchId: string, checked: boolean) {
    if (checked) {
      setChurchIds([...churchIds, churchId]);
    } else {
      setChurchIds(churchIds.filter((id) => id !== churchId));
    }
  }

  function handleSelectAllChurches(checked: boolean) {
    if (checked) {
      setChurchIds(filteredChurches.map((c) => c.id));
    } else {
      setChurchIds([]);
    }
  }

  function handleClassChange(classId: string, checked: boolean) {
    if (checked) {
      setClassIds([...classIds, classId]);
    } else {
      setClassIds(classIds.filter((id) => id !== classId));
    }
  }

  function handleSelectAllClasses(checked: boolean) {
    if (checked) {
      setClassIds(availableClasses.map((c) => c.id));
    } else {
      setClassIds([]);
    }
  }

  function handleDioceseChange(dioceseId: string, checked: boolean) {
    if (checked) {
      setDioceseIds([...dioceseIds, dioceseId]);
      // Auto-remove churches that are not in the selected dioceses
      const churchesInDiocese = churches
        .filter((c) => c.diocese_id === dioceseId)
        .map((c) => c.id);
      setChurchIds((prev) =>
        prev.filter(
          (id) =>
            churchesInDiocese.includes(id) ||
            churches.find(
              (c) => c.id === id && !dioceses.find((d) => d.id === c.diocese_id)
            )
        )
      );
    } else {
      setDioceseIds(dioceseIds.filter((id) => id !== dioceseId));
      // Remove churches from deselected diocese
      const churchesInDiocese = churches
        .filter((c) => c.diocese_id === dioceseId)
        .map((c) => c.id);
      setChurchIds((prev) =>
        prev.filter((id) => !churchesInDiocese.includes(id))
      );
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
    setDestinations(
      destinations
        .filter((_, i) => i !== index)
        .map((d, i) => ({ ...d, visit_order: i + 1 }))
    );
  }

  function updateDestination(
    index: number,
    field: keyof Destination,
    value: string
  ) {
    const updated = [...destinations];
    updated[index] = { ...updated[index], [field]: value };
    setDestinations(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.start_datetime ||
      !formData.end_datetime ||
      !formData.trip_type
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate destinations if any are added
    for (const dest of destinations) {
      if (!dest.destination_name.trim()) {
        toast.error("All destinations must have a destination name");
        return;
      }
    }

    setIsLoading(true);
    try {
      await createTripAction({
        ...formData,
        church_ids: churchIds.length > 0 ? churchIds : undefined,
        diocese_ids: dioceseIds.length > 0 ? dioceseIds : undefined,
        class_ids: classIds.length > 0 ? classIds : undefined,
        destinations: destinations.map((d) => ({
          destination_name: d.destination_name,
          description: d.description || undefined,
          visit_order: d.visit_order,
        })),
      } as CreateTripInput);
      toast.success("Trip created successfully");
      router.push("/admin/trips");
    } catch (error: unknown) {
      console.error("Error creating trip:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create trip"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
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
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter trip title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Enter trip description"
                    rows={4}
                  />
                </div>

                <TripImageUpload
                  value={formData.image_url || ""}
                  onChange={(url) => handleInputChange("image_url", url)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trip_type">{t("tripType")} *</Label>
                    <Select
                      value={formData.trip_type}
                      onValueChange={(value) =>
                        handleInputChange("trip_type", value)
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one_day">
                          {t("types.one_day")}
                        </SelectItem>
                        <SelectItem value="spiritual">
                          {t("types.spiritual")}
                        </SelectItem>
                        <SelectItem value="volunteering">
                          {t("types.volunteering")}
                        </SelectItem>
                        <SelectItem value="fun">{t("types.fun")}</SelectItem>
                        <SelectItem value="retreat">
                          {t("types.retreat")}
                        </SelectItem>
                        <SelectItem value="carnival">
                          {t("types.carnival")}
                        </SelectItem>
                        <SelectItem value="tournament">
                          {t("types.tournament")}
                        </SelectItem>
                        <SelectItem value="other">
                          {t("types.other")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
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
                    onChange={(e) =>
                      handleInputChange("start_datetime", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_datetime">End Date & Time *</Label>
                  <Input
                    id="end_datetime"
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) =>
                      handleInputChange("end_datetime", e.target.value)
                    }
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Destinations */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Destinations</CardTitle>
                <Button
                  type="button"
                  onClick={addDestination}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Destination
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {destinations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No destinations added. Click &quot;Add Destination&quot; to
                    add one.
                  </p>
                ) : (
                  destinations.map((dest, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            Destination {index + 1}
                          </span>
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
                          onChange={(e) =>
                            updateDestination(
                              index,
                              "destination_name",
                              e.target.value
                            )
                          }
                          placeholder="Enter destination name"
                          required
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={dest.description}
                          onChange={(e) =>
                            updateDestination(
                              index,
                              "description",
                              e.target.value
                            )
                          }
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
                  <Label htmlFor="transportation_details">
                    Transportation Details
                  </Label>
                  <Textarea
                    id="transportation_details"
                    value={formData.transportation_details || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "transportation_details",
                        e.target.value
                      )
                    }
                    placeholder="Enter transportation details"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="what_to_bring">What to Bring</Label>
                  <Textarea
                    id="what_to_bring"
                    value={formData.what_to_bring || ""}
                    onChange={(e) =>
                      handleInputChange("what_to_bring", e.target.value)
                    }
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
                    onCheckedChange={(checked) =>
                      handleInputChange("available", checked)
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    value={formData.max_participants || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "max_participants",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requires_parent_approval">
                    Requires Parent Approval
                  </Label>
                  <Switch
                    id="requires_parent_approval"
                    checked={formData.requires_parent_approval || false}
                    onCheckedChange={(checked) =>
                      handleInputChange("requires_parent_approval", checked)
                    }
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
                <div className="space-y-2">
                  <Label htmlFor="price_normal">Normal Price *</Label>
                  <Input
                    id="price_normal"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_normal || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "price_normal",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_mastor">Mastor Price *</Label>
                  <Input
                    id="price_mastor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_mastor || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "price_mastor",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_botl">Botl Price *</Label>
                  <Input
                    id="price_botl"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_botl || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "price_botl",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Church & Diocese Selection */}
            {(userProfile.role === "super_admin" ||
              userProfile.role === "diocese_admin") && (
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
                          <label
                            key={diocese.id}
                            className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={dioceseIds.includes(diocese.id)}
                              onChange={(e) =>
                                handleDioceseChange(
                                  diocese.id,
                                  e.target.checked
                                )
                              }
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
                      <div className="mb-2 pb-2 border-b">
                        <label className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer font-medium">
                          <input
                            type="checkbox"
                            checked={
                              filteredChurches.length > 0 &&
                              filteredChurches.every((c) =>
                                churchIds.includes(c.id)
                              )
                            }
                            onChange={(e) =>
                              handleSelectAllChurches(e.target.checked)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Select All Churches</span>
                        </label>
                      </div>
                      <div className="border rounded p-2 max-h-40 overflow-y-auto">
                        {filteredChurches.map((church) => (
                          <label
                            key={church.id}
                            className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={churchIds.includes(church.id)}
                              onChange={(e) =>
                                handleChurchChange(church.id, e.target.checked)
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm">
                              {church.name}
                              {church.diocese_id &&
                                ` - ${
                                  dioceses.find(
                                    (d) => d.id === church.diocese_id
                                  )?.name || ""
                                }`}
                            </span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Class Selection */}
                {churchIds.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Available in Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingClasses ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Loading classes...
                        </p>
                      ) : availableClasses.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No classes found for selected churches
                        </p>
                      ) : (
                        <>
                          <div className="mb-2 pb-2 border-b">
                            <label className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer font-medium">
                              <input
                                type="checkbox"
                                checked={
                                  availableClasses.length > 0 &&
                                  availableClasses.every((c) =>
                                    classIds.includes(c.id)
                                  )
                                }
                                onChange={(e) =>
                                  handleSelectAllClasses(e.target.checked)
                                }
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Select All Classes</span>
                            </label>
                          </div>
                          <div className="border rounded p-2 max-h-40 overflow-y-auto">
                            {availableClasses.map((classItem) => {
                              const church = churches.find(
                                (c) => c.id === classItem.church_id
                              );
                              return (
                                <label
                                  key={classItem.id}
                                  className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={classIds.includes(classItem.id)}
                                    onChange={(e) =>
                                      handleClassChange(
                                        classItem.id,
                                        e.target.checked
                                      )
                                    }
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm">
                                    {classItem.name}
                                    {church && ` - ${church.name}`}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

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
