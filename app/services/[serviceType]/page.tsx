"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Search, Plus, Edit, Trash2, Users, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ServiceClass {
  id: string
  name: string
  teacher: string
  studentCount: number
  description: string
  schedule: string
}

const serviceTypeConfig = {
  angels: { name: "Angels", icon: "👼", description: "Early childhood ministry" },
  primary: { name: "Primary", icon: "🌱", description: "Elementary age students" },
  secondary: { name: "Secondary", icon: "📚", description: "Middle school students" },
  high: { name: "High", icon: "🎓", description: "High school students" },
  university: { name: "University", icon: "🏛️", description: "College age ministry" },
  graduates: { name: "Graduates", icon: "👨‍💼", description: "Post-graduate ministry" },
}

const mockClasses: Record<string, ServiceClass[]> = {
  angels: [
    {
      id: "1",
      name: "Little Angels A",
      teacher: "Sister Mary",
      studentCount: 12,
      description: "Ages 3-4",
      schedule: "Sunday 9:00 AM",
    },
    {
      id: "2",
      name: "Little Angels B",
      teacher: "Mrs. Johnson",
      studentCount: 15,
      description: "Ages 4-5",
      schedule: "Sunday 10:30 AM",
    },
  ],
  primary: [
    {
      id: "3",
      name: "Primary Bible Stories",
      teacher: "Mr. Davis",
      studentCount: 18,
      description: "Ages 6-8",
      schedule: "Sunday 9:00 AM",
    },
    {
      id: "4",
      name: "Primary Worship",
      teacher: "Ms. Wilson",
      studentCount: 22,
      description: "Ages 8-10",
      schedule: "Sunday 10:30 AM",
    },
  ],
  secondary: [
    {
      id: "5",
      name: "Middle School Ministry",
      teacher: "Pastor Mike",
      studentCount: 16,
      description: "Ages 11-13",
      schedule: "Sunday 11:00 AM",
    },
    {
      id: "6",
      name: "Teen Bible Study",
      teacher: "Mrs. Brown",
      studentCount: 14,
      description: "Ages 12-14",
      schedule: "Wednesday 7:00 PM",
    },
  ],
  high: [
    {
      id: "7",
      name: "High School Youth",
      teacher: "Pastor John",
      studentCount: 25,
      description: "Ages 14-18",
      schedule: "Sunday 6:00 PM",
    },
    {
      id: "8",
      name: "Senior Prep Class",
      teacher: "Dr. Smith",
      studentCount: 12,
      description: "Ages 17-18",
      schedule: "Saturday 10:00 AM",
    },
  ],
  university: [
    {
      id: "9",
      name: "College Fellowship",
      teacher: "Pastor Sarah",
      studentCount: 20,
      description: "Ages 18-22",
      schedule: "Friday 7:00 PM",
    },
    {
      id: "10",
      name: "Young Adults",
      teacher: "Mr. Thompson",
      studentCount: 15,
      description: "Ages 22-25",
      schedule: "Sunday 7:00 PM",
    },
  ],
  graduates: [
    {
      id: "11",
      name: "Graduate Connect",
      teacher: "Dr. Williams",
      studentCount: 8,
      description: "Post-graduate",
      schedule: "Sunday 8:00 PM",
    },
    {
      id: "12",
      name: "Professional Ministry",
      teacher: "Mrs. Garcia",
      studentCount: 10,
      description: "Working professionals",
      schedule: "Thursday 7:30 PM",
    },
  ],
}

export default function ServiceClassesPage({ params }: { params: { serviceType: string } }) {
  const serviceType = params.serviceType as keyof typeof serviceTypeConfig
  const config = serviceTypeConfig[serviceType]

  const [classes, setClasses] = useState<ServiceClass[]>(mockClasses[serviceType] || [])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ServiceClass | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    teacher: "",
    description: "",
    schedule: "",
  })
  const { toast } = useToast()

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddClass = () => {
    if (!formData.name || !formData.teacher) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const newClass: ServiceClass = {
      id: Date.now().toString(),
      name: formData.name,
      teacher: formData.teacher,
      description: formData.description,
      schedule: formData.schedule,
      studentCount: 0,
    }

    setClasses([...classes, newClass])
    setFormData({ name: "", teacher: "", description: "", schedule: "" })
    setIsAddDialogOpen(false)
    toast({
      title: "Success",
      description: "Class added successfully",
    })
  }

  const handleEditClass = () => {
    if (!editingClass || !formData.name || !formData.teacher) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setClasses(
      classes.map((cls) =>
        cls.id === editingClass.id
          ? {
              ...cls,
              name: formData.name,
              teacher: formData.teacher,
              description: formData.description,
              schedule: formData.schedule,
            }
          : cls,
      ),
    )
    setEditingClass(null)
    setFormData({ name: "", teacher: "", description: "", schedule: "" })
    setIsEditDialogOpen(false)
    toast({
      title: "Success",
      description: "Class updated successfully",
    })
  }

  const handleDeleteClass = (classId: string) => {
    setClasses(classes.filter((cls) => cls.id !== classId))
    toast({
      title: "Success",
      description: "Class deleted successfully",
    })
  }

  const openEditDialog = (cls: ServiceClass) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      teacher: cls.teacher,
      description: cls.description,
      schedule: cls.schedule,
    })
    setIsEditDialogOpen(true)
  }

  if (!config) {
    return <div>Service type not found</div>
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/parishes">Parishes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/parishes/services">Services</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{config.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={`${config.name} Classes`}
        description={`Manage classes for ${config.description.toLowerCase()}`}
        icon={<BookOpen className="h-6 w-6" />}
        actionButton={{
          label: "Add Class",
          onClick: () => setIsAddDialogOpen(true),
        }}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{config.icon}</div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{classes.length}</div>
                <div className="text-sm text-gray-500">Total Classes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
                </div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {classes.length > 0
                    ? Math.round(classes.reduce((sum, cls) => sum + cls.studentCount, 0) / classes.length)
                    : 0}
                </div>
                <div className="text-sm text-gray-500">Avg per Class</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{cls.teacher}</TableCell>
                    <TableCell>{cls.description}</TableCell>
                    <TableCell>{cls.schedule}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        {cls.studentCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/parishes/services/${serviceType}/classes/${cls.id}/enrollment`}>
                            Manage Students
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(cls)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClasses.length === 0 && (
            <div className="text-center py-8 text-gray-500">No classes found matching your search.</div>
          )}
        </CardContent>
      </Card>

      {/* Add Class Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New {config.name} Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Class Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter class name"
              />
            </div>
            <div>
              <Label htmlFor="teacher">Teacher *</Label>
              <Input
                id="teacher"
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                placeholder="Enter teacher name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter class description"
              />
            </div>
            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Input
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="e.g., Sunday 9:00 AM"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClass}>
                <Plus className="h-4 w-4 mr-1" />
                Add Class
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {config.name} Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Class Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter class name"
              />
            </div>
            <div>
              <Label htmlFor="edit-teacher">Teacher *</Label>
              <Input
                id="edit-teacher"
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                placeholder="Enter teacher name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter class description"
              />
            </div>
            <div>
              <Label htmlFor="edit-schedule">Schedule</Label>
              <Input
                id="edit-schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="e.g., Sunday 9:00 AM"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditClass}>
                <Edit className="h-4 w-4 mr-1" />
                Update Class
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
