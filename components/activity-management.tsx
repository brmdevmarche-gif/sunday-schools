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
import { Calendar, Plus, Edit, Trash2, MapPin, Users, Clock, DollarSign, User } from "lucide-react"
import type { ChurchActivity, Church, Servant } from "@/lib/types"

export function ActivityManagement() {
  const [activities, setActivities] = useState<ChurchActivity[]>([
    {
      id: 1,
      church_id: 1,
      name: "Christmas Pageant",
      description: "Annual Christmas celebration with nativity play and carol singing",
      activity_type: "Event",
      start_date: "2024-12-24",
      end_date: "2024-12-24",
      start_time: "18:00",
      end_time: "20:00",
      location: "Main Church Hall",
      max_participants: 100,
      registration_required: true,
      cost: 0.0,
      organizer_servant_id: 1,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      church: {
        id: 1,
        name: "St. Mark Church",
        diocese_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      organizer_servant: {
        id: 1,
        church_id: 1,
        first_name: "Sarah",
        last_name: "Johnson",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
    {
      id: 2,
      church_id: 1,
      name: "Summer Bible Camp",
      description: "Week-long summer camp for children with Bible study, games, and crafts",
      activity_type: "Camp",
      start_date: "2024-07-15",
      end_date: "2024-07-19",
      start_time: "09:00",
      end_time: "15:00",
      location: "Church Grounds",
      max_participants: 50,
      registration_required: true,
      cost: 25.0,
      organizer_servant_id: 2,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      church: {
        id: 1,
        name: "St. Mark Church",
        diocese_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      organizer_servant: {
        id: 2,
        church_id: 1,
        first_name: "David",
        last_name: "Smith",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
    {
      id: 3,
      church_id: 2,
      name: "Youth Retreat",
      description: "Spiritual retreat for teenagers with workshops and fellowship",
      activity_type: "Retreat",
      start_date: "2024-08-10",
      end_date: "2024-08-12",
      start_time: "10:00",
      end_time: "16:00",
      location: "Mountain Retreat Center",
      max_participants: 30,
      registration_required: true,
      cost: 75.0,
      organizer_servant_id: 3,
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      church: {
        id: 2,
        name: "Holy Family Church",
        diocese_id: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      organizer_servant: {
        id: 3,
        church_id: 2,
        first_name: "Mary",
        last_name: "Wilson",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    },
    {
      id: 4,
      church_id: 3,
      name: "Community Service Day",
      description: "Volunteer work in the local community helping those in need",
      activity_type: "Service",
      start_date: "2024-06-01",
      end_date: "2024-06-01",
      start_time: "08:00",
      end_time: "17:00",
      location: "Various Community Locations",
      max_participants: 40,
      registration_required: false,
      cost: 0.0,
      organizer_servant_id: 4,
      is_active: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      church: {
        id: 3,
        name: "St. Mary Church",
        diocese_id: 2,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      organizer_servant: {
        id: 4,
        church_id: 3,
        first_name: "Joseph",
        last_name: "Brown",
        is_active: false,
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

  const [servants] = useState<Servant[]>([
    {
      id: 1,
      church_id: 1,
      first_name: "Sarah",
      last_name: "Johnson",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 2,
      church_id: 1,
      first_name: "David",
      last_name: "Smith",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 3,
      church_id: 2,
      first_name: "Mary",
      last_name: "Wilson",
      is_active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: 4,
      church_id: 3,
      first_name: "Joseph",
      last_name: "Brown",
      is_active: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ])

  const activityTypes = ["Event", "Camp", "Retreat", "Service", "Class", "Trip", "Workshop", "Conference"]

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<ChurchActivity | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChurch, setSelectedChurch] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    church_id: "",
    activity_type: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    location: "",
    max_participants: "",
    registration_required: false,
    cost: "",
    organizer_servant_id: "",
    is_active: true,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      church_id: "",
      activity_type: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      location: "",
      max_participants: "",
      registration_required: false,
      cost: "",
      organizer_servant_id: "",
      is_active: true,
    })
  }

  const handleAdd = () => {
    const newActivity: ChurchActivity = {
      id: Math.max(...activities.map((a) => a.id)) + 1,
      church_id: Number.parseInt(formData.church_id),
      name: formData.name,
      description: formData.description,
      activity_type: formData.activity_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
      max_participants: formData.max_participants ? Number.parseInt(formData.max_participants) : undefined,
      registration_required: formData.registration_required,
      cost: formData.cost ? Number.parseFloat(formData.cost) : 0,
      organizer_servant_id: formData.organizer_servant_id ? Number.parseInt(formData.organizer_servant_id) : undefined,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      church: churches.find((c) => c.id === Number.parseInt(formData.church_id)),
      organizer_servant: servants.find((s) => s.id === Number.parseInt(formData.organizer_servant_id || "0")),
    }
    setActivities([...activities, newActivity])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = (activity: ChurchActivity) => {
    setEditingActivity(activity)
    setFormData({
      name: activity.name,
      description: activity.description || "",
      church_id: activity.church_id.toString(),
      activity_type: activity.activity_type || "",
      start_date: activity.start_date || "",
      end_date: activity.end_date || "",
      start_time: activity.start_time || "",
      end_time: activity.end_time || "",
      location: activity.location || "",
      max_participants: activity.max_participants?.toString() || "",
      registration_required: activity.registration_required,
      cost: activity.cost.toString(),
      organizer_servant_id: activity.organizer_servant_id?.toString() || "",
      is_active: activity.is_active,
    })
  }

  const handleUpdate = () => {
    if (!editingActivity) return

    const updatedActivity: ChurchActivity = {
      ...editingActivity,
      name: formData.name,
      description: formData.description,
      church_id: Number.parseInt(formData.church_id),
      activity_type: formData.activity_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
      max_participants: formData.max_participants ? Number.parseInt(formData.max_participants) : undefined,
      registration_required: formData.registration_required,
      cost: formData.cost ? Number.parseFloat(formData.cost) : 0,
      organizer_servant_id: formData.organizer_servant_id ? Number.parseInt(formData.organizer_servant_id) : undefined,
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
      church: churches.find((c) => c.id === Number.parseInt(formData.church_id)),
      organizer_servant: servants.find((s) => s.id === Number.parseInt(formData.organizer_servant_id || "0")),
    }

    setActivities(activities.map((a) => (a.id === editingActivity.id ? updatedActivity : a)))
    setEditingActivity(null)
    resetForm()
  }

  const handleDelete = (id: number) => {
    setActivities(activities.filter((a) => a.id !== id))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const getActivityStatus = (activity: ChurchActivity) => {
    if (!activity.is_active) return "inactive"
    if (!activity.start_date) return "draft"

    const today = new Date()
    const startDate = new Date(activity.start_date)
    const endDate = activity.end_date ? new Date(activity.end_date) : startDate

    if (endDate < today) return "completed"
    if (startDate <= today && today <= endDate) return "ongoing"
    return "upcoming"
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
      case "ongoing":
        return <Badge className="bg-green-100 text-green-800">Ongoing</Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>
      default:
        return <Badge variant="outline">Draft</Badge>
    }
  }

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.church?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.activity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.location?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesChurch = selectedChurch === "all" || activity.church_id.toString() === selectedChurch

    const matchesType = selectedType === "all" || activity.activity_type === selectedType

    const matchesActive = !showActiveOnly || activity.is_active

    return matchesSearch && matchesChurch && matchesType && matchesActive
  })

  const availableServants = servants.filter(
    (s) => formData.church_id === "" || s.church_id.toString() === formData.church_id,
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Management</h1>
          <p className="text-muted-foreground mt-1">Manage church activities, events, and student participation.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
              <DialogDescription>Enter the activity information below.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Activity Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter activity name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity_type">Activity Type</Label>
                <Select
                  value={formData.activity_type}
                  onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="church">Church</Label>
                <Select
                  value={formData.church_id}
                  onValueChange={(value) => setFormData({ ...formData, church_id: value, organizer_servant_id: "" })}
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
                <Label htmlFor="organizer">Organizer</Label>
                <Select
                  value={formData.organizer_servant_id}
                  onValueChange={(value) => setFormData({ ...formData, organizer_servant_id: value })}
                  disabled={!formData.church_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organizer" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableServants.map((servant) => (
                      <SelectItem key={servant.id} value={servant.id.toString()}>
                        {servant.first_name} {servant.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter activity description"
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
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="Enter max participants"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="registration_required"
                    checked={formData.registration_required}
                    onCheckedChange={(checked) => setFormData({ ...formData, registration_required: checked })}
                  />
                  <Label htmlFor="registration_required">Registration Required</Label>
                </div>
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
              <Button onClick={handleAdd} disabled={!formData.name || !formData.church_id}>
                Add Activity
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search activities..."
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
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {activityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
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
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">{filteredActivities.length} Activities</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">
                {filteredActivities.filter((a) => getActivityStatus(a) === "upcoming").length} Upcoming
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardDescription>All church activities and events in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Church & Organizer</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <div>
                        <div className="font-medium">{activity.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {activity.activity_type && (
                            <Badge variant="outline" className="text-xs">
                              {activity.activity_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline">{activity.church?.name}</Badge>
                      {activity.organizer_servant && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {activity.organizer_servant.first_name} {activity.organizer_servant.last_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {activity.start_date && (
                        <div className="text-sm">
                          {formatDate(activity.start_date)}
                          {activity.end_date && activity.end_date !== activity.start_date && (
                            <span> - {formatDate(activity.end_date)}</span>
                          )}
                        </div>
                      )}
                      {activity.start_time && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(activity.start_time)}
                          {activity.end_time && <span> - {formatTime(activity.end_time)}</span>}
                        </div>
                      )}
                      {activity.location && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {activity.location}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {activity.max_participants && (
                        <div className="text-sm flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Max {activity.max_participants}
                        </div>
                      )}
                      {activity.cost > 0 && (
                        <div className="text-sm flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />${activity.cost}
                        </div>
                      )}
                      {activity.registration_required && (
                        <Badge variant="outline" className="text-xs">
                          Registration Required
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(getActivityStatus(activity))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog
                        open={editingActivity?.id === activity.id}
                        onOpenChange={(open) => !open && setEditingActivity(null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(activity)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Activity</DialogTitle>
                            <DialogDescription>Update the activity information below.</DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Activity Name</Label>
                              <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter activity name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-activity_type">Activity Type</Label>
                              <Select
                                value={formData.activity_type}
                                onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select activity type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activityTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-church">Church</Label>
                              <Select
                                value={formData.church_id}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, church_id: value, organizer_servant_id: "" })
                                }
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
                              <Label htmlFor="edit-organizer">Organizer</Label>
                              <Select
                                value={formData.organizer_servant_id}
                                onValueChange={(value) => setFormData({ ...formData, organizer_servant_id: value })}
                                disabled={!formData.church_id}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select organizer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableServants.map((servant) => (
                                    <SelectItem key={servant.id} value={servant.id.toString()}>
                                      {servant.first_name} {servant.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter activity description"
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
                            <div className="space-y-2">
                              <Label htmlFor="edit-end_date">End Date</Label>
                              <Input
                                id="edit-end_date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-start_time">Start Time</Label>
                              <Input
                                id="edit-start_time"
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-end_time">End Time</Label>
                              <Input
                                id="edit-end_time"
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-location">Location</Label>
                              <Input
                                id="edit-location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Enter location"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-max_participants">Max Participants</Label>
                              <Input
                                id="edit-max_participants"
                                type="number"
                                value={formData.max_participants}
                                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                                placeholder="Enter max participants"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-cost">Cost ($)</Label>
                              <Input
                                id="edit-cost"
                                type="number"
                                step="0.01"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-registration_required"
                                  checked={formData.registration_required}
                                  onCheckedChange={(checked) =>
                                    setFormData({ ...formData, registration_required: checked })
                                  }
                                />
                                <Label htmlFor="edit-registration_required">Registration Required</Label>
                              </div>
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
                            <Button variant="outline" onClick={() => setEditingActivity(null)}>
                              Cancel
                            </Button>
                            <Button onClick={handleUpdate} disabled={!formData.name || !formData.church_id}>
                              Update Activity
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(activity.id)}
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
