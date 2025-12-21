"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { createStoreItemAction } from "../actions";
import type { ExtendedUser } from "@/lib/types";

interface Church {
  id: string;
  name: string;
  diocese_id: string;
}

interface ClassItem {
  id: string;
  name: string;
  church_id: string;
}

interface CreateStoreItemClientProps {
  userProfile: ExtendedUser;
  churches: Church[];
  dioceses: { id: string; name: string }[];
  classes: ClassItem[];
}

export default function CreateStoreItemClient({
  userProfile,
  churches,
  dioceses,
  classes,
}: CreateStoreItemClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    stock_type: "quantity" as "quantity" | "on_demand",
    stock_quantity: 0,
    price_normal: 0,
    price_mastor: 0,
    price_botl: 0,
    church_ids: [] as string[],
    diocese_ids: [] as string[],
    is_available_to_all_classes: true,
    class_ids: [] as string[],
  });

  // Filter churches based on selected dioceses
  const filteredChurches =
    formData.diocese_ids.length > 0
      ? churches.filter((church) =>
          formData.diocese_ids.includes(church.diocese_id)
        )
      : churches;

  // Filter classes based on selected churches
  const filteredClasses =
    formData.church_ids.length > 0
      ? classes.filter((classItem) =>
          formData.church_ids.includes(classItem.church_id)
        )
      : classes;

  function handleDioceseChange(dioceseId: string, checked: boolean) {
    let newDioceseIds: string[];
    if (checked) {
      newDioceseIds = [...formData.diocese_ids, dioceseId];
    } else {
      newDioceseIds = formData.diocese_ids.filter((id) => id !== dioceseId);
    }

    const validChurches =
      newDioceseIds.length > 0
        ? churches.filter((church) => newDioceseIds.includes(church.diocese_id))
        : churches;

    const validChurchIds = formData.church_ids.filter((id) =>
      validChurches.some((church) => church.id === id)
    );

    setFormData({
      ...formData,
      diocese_ids: newDioceseIds,
      church_ids: validChurchIds,
    });
  }

  function handleChurchChange(churchId: string, checked: boolean) {
    let newChurchIds: string[];
    if (checked) {
      newChurchIds = [...formData.church_ids, churchId];
    } else {
      newChurchIds = formData.church_ids.filter((id) => id !== churchId);
    }

    const validClasses =
      newChurchIds.length > 0
        ? classes.filter((classItem) =>
            newChurchIds.includes(classItem.church_id)
          )
        : classes;

    const validClassIds = formData.class_ids.filter((id) =>
      validClasses.some((classItem) => classItem.id === id)
    );

    setFormData({
      ...formData,
      church_ids: newChurchIds,
      class_ids: validClassIds,
    });
  }

  function handleClassChange(classId: string, checked: boolean) {
    if (checked) {
      setFormData({
        ...formData,
        class_ids: [...formData.class_ids, classId],
      });
    } else {
      setFormData({
        ...formData,
        class_ids: formData.class_ids.filter((id) => id !== classId),
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.name ||
      (formData.stock_type === "quantity" && formData.stock_quantity < 0)
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await createStoreItemAction({
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url,
        stock_type: formData.stock_type,
        stock_quantity: formData.stock_quantity,
        price_normal: formData.price_normal,
        price_mastor: formData.price_mastor,
        price_botl: formData.price_botl,
        church_ids: formData.church_ids,
        diocese_ids: formData.diocese_ids,
        is_available_to_all_classes: formData.is_available_to_all_classes,
        class_ids: formData.class_ids,
      });
      toast.success("Store item created successfully");
      router.push("/admin/store");
    } catch (error: unknown) {
      console.error("Error creating store item:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create store item"
      );
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
          <h1 className="text-3xl font-bold">Add Store Item</h1>
          <p className="text-muted-foreground mt-1">
            Create a new item for the store
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
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter item description"
                    rows={4}
                  />
                </div>

                <ImageUpload
                  label="Item Image"
                  currentImageUrl={formData.image_url}
                  onImageUploaded={(url) =>
                    setFormData({ ...formData, image_url: url })
                  }
                  bucket="images"
                  folder="store/items"
                  maxSizeMB={3}
                />
              </CardContent>
            </Card>

            {/* Stock Management */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Stock Type *</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stock_type"
                        value="quantity"
                        checked={formData.stock_type === "quantity"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock_type: e.target
                              .value as "quantity" | "on_demand",
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>Limited Quantity</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stock_type"
                        value="on_demand"
                        checked={formData.stock_type === "on_demand"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock_type: e.target
                              .value as "quantity" | "on_demand",
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>Available on Demand</span>
                    </label>
                  </div>
                </div>

                {formData.stock_type === "quantity" && (
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock_quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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
                    value={formData.price_normal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_normal: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Points"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price_mastor">Mastor Price *</Label>
                  <Input
                    id="price_mastor"
                    type="number"
                    min="0"
                    value={formData.price_mastor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_mastor: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Points"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price_botl">Botl Price *</Label>
                  <Input
                    id="price_botl"
                    type="number"
                    min="0"
                    value={formData.price_botl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_botl: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="Points"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Diocese & Church Selection */}
            {userProfile.role === "super_admin" && (
              <>
                {dioceses.length > 0 && (
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
                              checked={formData.diocese_ids.includes(
                                diocese.id
                              )}
                              onChange={(e) =>
                                handleDioceseChange(diocese.id, e.target.checked)
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

                {churches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Available in Churches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded p-2 max-h-40 overflow-y-auto">
                        {filteredChurches.map((church) => (
                          <label
                            key={church.id}
                            className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.church_ids.includes(church.id)}
                              onChange={(e) =>
                                handleChurchChange(church.id, e.target.checked)
                              }
                              className="w-4 h-4"
                            />
                            <span className="text-sm">
                              {church.name}
                              {church.diocese_id &&
                                (() => {
                                  const diocese = dioceses.find(
                                    (d) => d.id === church.diocese_id
                                  );
                                  return diocese ? ` - ${diocese.name}` : "";
                                })()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Class Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Class Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="all_classes">Available to All Classes</Label>
                  <Switch
                    id="all_classes"
                    checked={formData.is_available_to_all_classes}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        is_available_to_all_classes: checked,
                        class_ids: checked ? [] : formData.class_ids,
                      })
                    }
                  />
                </div>

                {!formData.is_available_to_all_classes &&
                  filteredClasses.length > 0 && (
                    <div className="border rounded p-2 max-h-40 overflow-y-auto">
                      {filteredClasses.map((classItem) => (
                        <label
                          key={classItem.id}
                          className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.class_ids.includes(classItem.id)}
                            onChange={(e) =>
                              handleClassChange(classItem.id, e.target.checked)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{classItem.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Creating..." : "Create Item"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
