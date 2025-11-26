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
  Church,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import type { Church as ChurchType, Diocese } from "@/lib/types";

export function ChurchManagement() {
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [dioceses, setDioceses] = useState<Diocese[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<ChurchType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  const [formData, setFormData] = useState({
    name: "",
    diocese_id: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    priest_name: "",
    established_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch churches with diocese information
      const { data: churchesData, error: churchesError } = await supabase
        .from("churches")
        .select(
          `
          *,
          diocese:dioceses (*)
        `
        )
        .order("name");

      if (churchesError) throw churchesError;

      // Fetch dioceses
      const { data: diocesesData, error: diocesesError } = await supabase
        .from("dioceses")
        .select("*")
        .order("name");

      if (diocesesError) throw diocesesError;

      setChurches(churchesData || []);
      setDioceses(diocesesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      diocese_id: "",
      address: "",
      contact_email: "",
      contact_phone: "",
      priest_name: "",
      established_date: "",
    });
  };

  const handleAdd = async () => {
    try {
      const { data, error } = await supabase.from("churches").insert([
        {
          name: formData.name,
          diocese_id: Number.parseInt(formData.diocese_id),
          address: formData.address,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          priest_name: formData.priest_name,
          established_date: formData.established_date,
        },
      ]).select(`
          *,
          diocese:dioceses (*)
        `);

      if (error) throw error;

      if (data) {
        setChurches([...churches, ...data]);
      }
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding church:", error);
    }
  };

  const handleEdit = (church: ChurchType) => {
    setEditingChurch(church);
    setFormData({
      name: church.name,
      diocese_id: church.diocese_id.toString(),
      address: church.address || "",
      contact_email: church.contact_email || "",
      contact_phone: church.contact_phone || "",
      priest_name: church.priest_name || "",
      established_date: church.established_date || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingChurch) return;

    try {
      const { data, error } = await supabase
        .from("churches")
        .update({
          name: formData.name,
          diocese_id: Number.parseInt(formData.diocese_id),
          address: formData.address,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          priest_name: formData.priest_name,
          established_date: formData.established_date,
        })
        .eq("id", editingChurch.id).select(`
          *,
          diocese:dioceses (*)
        `);

      if (error) throw error;

      if (data) {
        setChurches(
          churches.map((c) => (c.id === editingChurch.id ? data[0] : c))
        );
      }
      setEditingChurch(null);
      resetForm();
    } catch (error) {
      console.error("Error updating church:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("churches").delete().eq("id", id);

      if (error) throw error;

      setChurches(churches.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting church:", error);
    }
  };

  const filteredChurches = churches.filter(
    (church) =>
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.diocese?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.priest_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Loading Churches...
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
            Church Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage churches and their information across all dioceses.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <SimpleDialogTrigger>
            <SimpleButton className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Church
            </SimpleButton>
          </SimpleDialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Add New Church</DialogTitle>
              <DialogDescription>
                Enter the church information below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Church Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter church name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diocese">Diocese</Label>
                <Select
                  value={formData.diocese_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, diocese_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select diocese" />
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
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter church address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  placeholder="church@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  placeholder="+20-xxx-xxx-xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priest">Priest Name</Label>
                <Input
                  id="priest"
                  value={formData.priest_name}
                  onChange={(e) =>
                    setFormData({ ...formData, priest_name: e.target.value })
                  }
                  placeholder="Father Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="established">Established Date</Label>
                <Input
                  id="established"
                  type="date"
                  value={formData.established_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      established_date: e.target.value,
                    })
                  }
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
                disabled={!formData.name || !formData.diocese_id}
              >
                Add Church
              </SimpleButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search churches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-muted/50"
          />
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Church className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">
                {churches.length} Churches
              </span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                {dioceses.length} Dioceses
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Churches Table */}
      <Card>
        <CardHeader>
          <CardTitle>Churches</CardTitle>
          <CardDescription>
            All registered churches in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Church Name</TableHead>
                <TableHead>Diocese</TableHead>
                <TableHead>Priest</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Established</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChurches.map((church) => (
                <TableRow key={church.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Church className="w-4 h-4 text-accent" />
                      <div>
                        <div className="font-medium">{church.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {church.address}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{church.diocese?.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {church.priest_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {church.contact_email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {church.contact_email}
                        </div>
                      )}
                      {church.contact_phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {church.contact_phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {church.established_date &&
                      new Date(church.established_date).getFullYear()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog
                        open={editingChurch?.id === church.id}
                        onOpenChange={(open) => !open && setEditingChurch(null)}
                      >
                        <SimpleDialogTrigger>
                          <SimpleButton
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(church)}
                          >
                            <Edit className="w-4 h-4" />
                          </SimpleButton>
                        </SimpleDialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Edit Church</DialogTitle>
                            <DialogDescription>
                              Update the church information below.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Church Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Enter church name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-diocese">Diocese</Label>
                              <Select
                                value={formData.diocese_id}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    diocese_id: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select diocese" />
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
                                placeholder="Enter church address"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Contact Email</Label>
                              <Input
                                id="edit-email"
                                type="email"
                                value={formData.contact_email}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    contact_email: e.target.value,
                                  })
                                }
                                placeholder="church@example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-phone">Contact Phone</Label>
                              <Input
                                id="edit-phone"
                                value={formData.contact_phone}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    contact_phone: e.target.value,
                                  })
                                }
                                placeholder="+20-xxx-xxx-xxxx"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-priest">Priest Name</Label>
                              <Input
                                id="edit-priest"
                                value={formData.priest_name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    priest_name: e.target.value,
                                  })
                                }
                                placeholder="Father Name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-established">
                                Established Date
                              </Label>
                              <Input
                                id="edit-established"
                                type="date"
                                value={formData.established_date}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    established_date: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <SimpleButton
                              variant="outline"
                              onClick={() => setEditingChurch(null)}
                            >
                              Cancel
                            </SimpleButton>
                            <SimpleButton
                              onClick={handleUpdate}
                              disabled={!formData.name || !formData.diocese_id}
                            >
                              Update Church
                            </SimpleButton>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <SimpleButton
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(church.id)}
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
