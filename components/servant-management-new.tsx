"use client";

import React from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  Calendar,
  Church,
  Shield,
  Heart,
  MapPin,
} from "lucide-react";
import {
  useServantManagement,
  ServantFormData,
} from "@/hooks/useServantManagement";

const serviceRoles = ["superAdmin", "admin", "servant", "beginner"] as const;

export function ServantManagement() {
  const {
    servants,
    churches,
    loading,
    error,
    submitting,
    dialogOpen,
    editingServant,
    formData,
    setDialogOpen,
    updateFormData,
    resetForm,
    handleSubmit,
    handleEdit,
    handleDelete,
  } = useServantManagement();

  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleDeleteClick = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete servant "${name}"?`)) return;

    try {
      await handleDelete(id);
    } catch (error) {
      alert("Error deleting servant. Please try again.");
    }
  };

  const getServiceRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      superAdmin: "bg-red-100 text-red-800",
      admin: "bg-blue-100 text-blue-800",
      servant: "bg-green-100 text-green-800",
      beginner: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge
        variant="secondary"
        className={roleColors[role] || "bg-gray-100 text-gray-800"}
      >
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Servants</h1>
          <p className="text-muted-foreground mt-1">
            Manage church servants and ministry leaders
          </p>
        </div>
        <SimpleButton onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Servant
        </SimpleButton>
      </div>

      {/* Servants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Servants ({servants.length})
          </CardTitle>
          <CardDescription>All servants in your ministry</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading servants...</div>
          ) : servants.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No servants found
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first servant.
              </p>
              <SimpleButton onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add Servant
              </SimpleButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Service Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servants.map((servant) => (
                    <TableRow key={servant.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {servant.first_name} {servant.last_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {servant.church ? (
                          <div className="flex items-center gap-1">
                            <Church className="w-4 h-4 text-muted-foreground" />
                            {servant.church.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {servant.role ? (
                          getServiceRoleBadge(servant.role)
                        ) : (
                          <span className="text-muted-foreground">
                            No role assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {servant.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {servant.email}
                            </div>
                          )}
                          {servant.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {servant.phone}
                            </div>
                          )}
                          {servant.address && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">
                                {servant.address}
                              </span>
                            </div>
                          )}
                          {!servant.email &&
                            !servant.phone &&
                            !servant.address && (
                              <span className="text-muted-foreground text-sm">
                                No contact info
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {servant.start_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {new Date(servant.start_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={servant.is_active ? "default" : "secondary"}
                          className={
                            servant.is_active
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {servant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(servant)}
                          >
                            <Edit className="w-4 h-4" />
                          </SimpleButton>
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDeleteClick(
                                servant.id,
                                `${servant.first_name} ${servant.last_name}`
                              )
                            }
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

      {/* Add/Edit Servant Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              {editingServant ? "Edit Servant" : "Add New Servant"}
            </DialogTitle>
            <DialogDescription>
              {editingServant
                ? "Update servant information below."
                : "Fill in the information below to add a new servant."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <div className="bg-destructive/15 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

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
                      updateFormData("first_name", e.target.value)
                    }
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
                      updateFormData("last_name", e.target.value)
                    }
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
                      updateFormData("date_of_birth", e.target.value)
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
                      updateFormData("church_id", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a church" />
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
              </div>
              {/* Remove address field until database is fixed */}
            </div>

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
                    onChange={(e) => updateFormData("email", e.target.value)}
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
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

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
                    onValueChange={(value) => updateFormData("role", value)}
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
                      updateFormData("start_date", e.target.value)
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="text-foreground">
                Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Full address"
                rows={2}
                className="mt-1"
              />
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
                <User className="w-4 h-4" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year_type" className="text-foreground">
                    Year Type (if applicable)
                  </Label>
                  <Select
                    value={formData.year_type || "none"}
                    onValueChange={(value) => {
                      const yearType =
                        value === "none"
                          ? null
                          : (value as
                              | "kg"
                              | "primary"
                              | "preparatory"
                              | "secondary");
                      updateFormData("year_type", yearType);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select year type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="kg">Kindergarten</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="preparatory">Preparatory</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="end_date" className="text-foreground">
                    End Date (if applicable)
                  </Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => updateFormData("end_date", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <SimpleButton variant="outline" onClick={handleCancel}>
              Cancel
            </SimpleButton>
            <SimpleButton onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? editingServant
                  ? "Updating..."
                  : "Adding..."
                : editingServant
                ? "Update Servant"
                : "Add Servant"}
            </SimpleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
