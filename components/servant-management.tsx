"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { UserCheck, Plus, Edit, Trash2, Phone, Mail, User, Calendar, Award } from "lucide-react"
import type { Servant, Church } from "@/lib/types"

export function ServantManagement() {
  const [servants, setServants] = useState<Servant[]>([
    {
      id: 1,
      church_id: 1,
      first_name: "Sarah",
      last_name: "Johnson",
      email: "sarah.johnson@email.com",
      phone: "+20-10-111-1111",
      date_of_birth: "1985-06-15",
      address: "123 Faith Street, Alexandria",
      role: "Teacher",
      specialization: "Youth Ministry",
      start_date: "2020-09-01",
      is_active: true,
      emergency_contact_name: "Michael Johnson",
      emergency_contact_phone: "+20-10-111-1112",
      notes: "Excellent with children, very dedicated",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      church: {
        id: 1,
        name: "St. Mark Church",
        diocese_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
    {
      id: 2,
      church_id: 1,
      first_name: "David",
      last_name: "Smith",
      email: "david.smith@email.com",
      phone: "+20-10-222-2222",
      date_of_birth: "1978-03-22",
      address: "456 Hope Avenue, Alexandria",
      role: "Coordinator",
      specialization: "Music Ministry",
      start_date: "2019-01-15",
      is_active: true,
      emergency_contact_name: "Lisa Smith",
      emergency_contact_phone: "+20-10-222-2223",
      notes: "Leads the church choir and music activities",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      church: {
        id: 1,
        name: "St. Mark Church",
        diocese_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
    {
      id: 3,
      church_id: 2,
      first_name: "Mary",
      last_name: "Wilson",
      email: "mary.wilson@email.com",
      phone: "+20-10-333-3333",
      date_of_birth: "1982-11-08",
      address: "789 Grace Road, Alexandria",
      role: "Teacher",
      specialization: "Arts and Crafts",
      start_date: "2021-02-01",
      is_active: true,
      emergency_contact_name: "John Wilson",
      emergency_contact_phone: "+20-10-333-3334",
      notes: "Creative and artistic, great with hands-on activities",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      church: {
        id: 2,
        name: "Holy Family Church",
        diocese_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
    {
      id: 4,
      church_id: 3,
      first_name: "Joseph",
      last_name: "Brown",
      email: "joseph.brown@email.com",
      phone: "+20-10-444-4444",
      date_of_birth: "1975-09-12",
      address: "321 Prayer Lane, Cairo",
      role: "Assistant",
      specialization: "Sports Activities",
      start_date: "2018-08-20",
      is_active: false,
      emergency_contact_name: "Maria Brown",
      emergency_contact_phone: "+20-10-444-4445",
      notes: "Currently on leave, excellent sports coordinator",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      church: {
        id: 3,
        name: "St. Mary Church",
        diocese_id: 2,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
  ])

  const [churches] = useState<Church[]>([
    {
      id: 1,
      name: "St. Mark Church",
      diocese_id: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      name: "Holy Family Church",
      diocese_id: 1,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 3,
      name: "St. Mary Church",
      diocese_id: 2,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ])

  const roles = ["Teacher", "Coordinator", "Assistant", "Volunteer", "Administrator"]
  const specializations = [
    "Youth Ministry",
    "Music Ministry",
    "Arts and Crafts",
    "Sports Activities",
    "Bible Study",
    "Prayer Ministry",
    "Community Outreach",
    "Administration",
    "Technology",
    "Special Needs",
  ]

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingServant, setEditingServant] = useState<Servant | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChurch, setSelectedChurch] = useState<string>("all")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [showActiveOnly, setShowActiveOnly] = useState(true)

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
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    is_active: true,
  })

  const resetForm = () => {
    setFormData({
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
      emergency_contact_name: "",
      emergency_contact_phone: "",
      notes: "",
      is_active: true,
    })
  }

  const handleAdd = () => {
    const newServant: Servant = {
      id: Math.max(...servants.map((s) => s.id)) + 1,
      church_id: Number.parseInt(formData.church_id),
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth,
      address: formData.address,
      role: formData.role,
      specialization: formData.specialization,
      start_date: formData.start_date,
      is_active: formData.is_active,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
      notes: formData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      church: churches.find((c) => c.id === Number.parseInt(formData.church_id)),
    }
    setServants([...servants, newServant])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = (servant: Servant) => {
    setEditingServant(servant)
    setFormData({
      first_name: servant.first_name,
      last_name: servant.last_name,
      church_id: servant.church_id.toString(),
      email: servant.email || "",
      phone: servant.phone || "",
      date_of_birth: servant.date_of_birth || "",
      address: servant.address || "",
      role: servant.role || "",
      specialization: servant.specialization || "",
      start_date: servant.start_date || "",
      emergency_contact_name: servant.emergency_contact_name || "",
      emergency_contact_phone: servant.emergency_contact_phone || "",
      notes: servant.notes || "",
      is_active: servant.is_active,
    })
  }

  const handleUpdate = () => {
    if (!editingServant) return

    const updatedServant: Servant = {
      ...editingServant,
      first_name: formData.first_name,
      last_name: formData.last_name,
      church_id: Number.parseInt(formData.church_id),
      email: formData.email,
      phone: formData.phone,
      date_of_birth: formData.date_of_birth,
      address: formData.address,
      role: formData.role,
      specialization: formData.specialization,
      start_date: formData.start_date,
      is_active: formData.is_active,
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
      notes: formData.notes,
      updated_at: new Date().toISOString(),
      church: churches.find((c) => c.id === Number.parseInt(formData.church_id)),
    }

    setServants(servants.map((s) => (s.id === editingServant.id ? updatedServant : s)))
    setEditingServant(null)
    resetForm()
  }

  const handleDelete = (id: number) => {
    setServants(servants.filter((s) => s.id !== id))
  }

  const calculateYearsOfService = (startDate: string) => {
    const today = new Date()
    const start = new Date(startDate)
    const years = today.getFullYear() - start.getFullYear()
    const monthDiff = today.getMonth() - start.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < start.getDate())) {
      return Math.max(0, years - 1)
    }
    return years
  }

  const filteredServants = servants.filter((servant) => {
    const matchesSearch =
      servant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servant.church?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servant.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servant.specialization?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesChurch = selectedChurch === "all" || servant.church_id.toString() === selectedChurch

    const matchesRole = selectedRole === "all" || servant.role === selectedRole

    const matchesActive = !showActiveOnly || servant.is_active

    return matchesSearch && matchesChurch && matchesRole && matchesActive
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Servant Management</h1>
          <p className="text-muted-foreground mt-1">Manage teachers, volunteers, and their assignments.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Servant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Servant</DialogTitle>
              <DialogDescription>Enter the servant information below.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="church">Church</Label>
                <Select
                  value={formData.church_id}
                  onValueChange={(value) => setFormData({ ...formData, church_id: value })}
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
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="servant@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+20-xxx-xxx-xxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter servant address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Enter emergency contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="+20-xxx-xxx-xxxx"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the servant"
                />
              </div>
              <div className="flex items-center space-x-2 col-span-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active Status</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!formData.first_name || !formData.last_name || !formData.church_id}>
                Add Servant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search servants..."
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
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch id="active-only" checked={showActiveOnly} onCheckedChange={setShowActiveOnly} />
          <Label htmlFor="active-only">Active Only</Label>
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{filteredServants.length} Servants</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">{filteredServants.filter((s) => s.is_active).length} Active</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Servants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Servants</CardTitle>
          <CardDescription>All registered servants in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servant</TableHead>
                <TableHead>Church & Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServants.map((servant) => (
                <TableRow key={servant.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-accent" />
                      <div>
                        <div className="font-medium">
                          {servant.first_name} {servant.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {servant.specialization && (
                            <>
                              <Award className="w-3 h-3" />
                              {servant.specialization}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline">{servant.church?.name}</Badge>
                      {servant.role && <div className="text-sm text-muted-foreground">{servant.role}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {servant.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="w-3 h-3" />
                          {servant.email}
                        </div>
                      )}
                      {servant.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {servant.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {servant.start_date && (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {calculateYearsOfService(servant.start_date)} years
                        </div>
                      )}
                      {servant.start_date && (
                        <div className="text-xs text-muted-foreground">
                          Since {new Date(servant.start_date).getFullYear()}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={servant.is_active ? "default" : "secondary"}>
                      {servant.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog
                        open={editingServant?.id === servant.id}
                        onOpenChange={(open) => !open && setEditingServant(null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(servant)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Servant</DialogTitle>
                            <DialogDescription>Update the servant information below.</DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-first_name">First Name</Label>
                              <Input
                                id="edit-first_name"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                placeholder="Enter first name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-last_name">Last Name</Label>
                              <Input
                                id="edit-last_name"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                placeholder="Enter last name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-church">Church</Label>
                              <Select
                                value={formData.church_id}
                                onValueChange={(value) => setFormData({ ...formData, church_id: value })}
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
                              <Label htmlFor="edit-role">Role</Label>
                              <Select
                                value={formData.role}
                                onValueChange={(value) => setFormData({ ...formData, role: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-specialization">Specialization</Label>
                              <Select
                                value={formData.specialization}
                                onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select specialization" />
                                </SelectTrigger>
                                <SelectContent>
                                  {specializations.map((spec) => (
                                    <SelectItem key={spec} value={spec}>
                                      {spec}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-email">Email</Label>
                              <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="servant@example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-phone">Phone</Label>
                              <Input
                                id="edit-phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+20-xxx-xxx-xxxx"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-date_of_birth">Date of Birth</Label>
                              <Input
                                id="edit-date_of_birth"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-start_date">Start Date</Label>
                              <Input
                                id="edit-start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-address">Address</Label>
                              <Textarea
                                id="edit-address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Enter servant address"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-emergency_name">Emergency Contact Name</Label>
                              <Input
                                id="edit-emergency_name"
                                value={formData.emergency_contact_name}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                                placeholder="Enter emergency contact name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-emergency_phone">Emergency Contact Phone</Label>
                              <Input
                                id="edit-emergency_phone"
                                value={formData.emergency_contact_phone}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                                placeholder="+20-xxx-xxx-xxxx"
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-notes">Notes</Label>
                              <Textarea
                                id="edit-notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes about the servant"
                              />
                            </div>
                            <div className="flex items-center space-x-2 col-span-2">
                              <Switch
                                id="edit-is_active"
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                              />
                              <Label htmlFor="edit-is_active">Active Status</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingServant(null)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpdate}
                              disabled={!formData.first_name || !formData.last_name || !formData.church_id}
                            >
                              Update Servant
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(servant.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
