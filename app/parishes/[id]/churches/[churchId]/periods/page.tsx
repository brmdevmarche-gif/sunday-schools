"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Search, Plus, Edit, Trash2, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Period {
  id: string
  name: string
  startDate: string
  endDate: string
  active: boolean
}

export default function PeriodsPage({
  params,
}: {
  params: { id: string; churchId: string }
}) {
  const { toast } = useToast()
  const [periods, setPeriods] = useState<Period[]>([
    {
      id: "1",
      name: "Spring Semester 2024",
      startDate: "2024-01-15",
      endDate: "2024-05-15",
      active: true,
    },
    {
      id: "2",
      name: "Summer Session 2024",
      startDate: "2024-06-01",
      endDate: "2024-08-31",
      active: false,
    },
    {
      id: "3",
      name: "Fall Semester 2024",
      startDate: "2024-09-01",
      endDate: "2024-12-15",
      active: true,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    active: true,
  })

  // Mock data for parish and church names
  const parishName = "St. Mary Parish"
  const churchName = "Sacred Heart Church"

  const filteredPeriods = periods.filter((period) => period.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleAddPeriod = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const newPeriod: Period = {
      id: Date.now().toString(),
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      active: formData.active,
    }

    setPeriods([...periods, newPeriod])
    setFormData({ name: "", startDate: "", endDate: "", active: true })
    setIsAddDialogOpen(false)

    toast({
      title: "Success",
      description: "Period added successfully.",
    })
  }

  const handleEditPeriod = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!editingPeriod) return

    const updatedPeriods = periods.map((period) =>
      period.id === editingPeriod.id
        ? {
            ...period,
            name: formData.name,
            startDate: formData.startDate,
            endDate: formData.endDate,
            active: formData.active,
          }
        : period,
    )

    setPeriods(updatedPeriods)
    setEditingPeriod(null)
    setFormData({ name: "", startDate: "", endDate: "", active: true })
    setIsEditDialogOpen(false)

    toast({
      title: "Success",
      description: "Period updated successfully.",
    })
  }

  const handleDeletePeriod = (periodId: string) => {
    setPeriods(periods.filter((period) => period.id !== periodId))
    toast({
      title: "Success",
      description: "Period deleted successfully.",
    })
  }

  const handleToggleActive = (periodId: string) => {
    const updatedPeriods = periods.map((period) =>
      period.id === periodId ? { ...period, active: !period.active } : period,
    )
    setPeriods(updatedPeriods)

    toast({
      title: "Success",
      description: "Period status updated successfully.",
    })
  }

  const openEditDialog = (period: Period) => {
    setEditingPeriod(period)
    setFormData({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      active: period.active,
    })
    setIsEditDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/parishes">Parishes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/parishes/${params.id}/churches`}>{parishName}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Periods</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={`Periods for ${churchName}`}
        description="Manage academic periods and sessions for this church"
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Period
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Period</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Period Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Spring Semester 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPeriod}>Add Period</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-6">
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search periods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Periods Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPeriods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No periods found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPeriods.map((period) => (
                    <TableRow key={period.id}>
                      <TableCell className="font-medium">{period.name}</TableCell>
                      <TableCell>{formatDate(period.startDate)}</TableCell>
                      <TableCell>{formatDate(period.endDate)}</TableCell>
                      <TableCell>
                        <Switch checked={period.active} onCheckedChange={() => handleToggleActive(period.id)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(period)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeletePeriod(period.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Period</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Period Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Spring Semester 2024"
              />
            </div>
            <div>
              <Label htmlFor="edit-startDate">Start Date</Label>
              <Input
                id="edit-startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-endDate">End Date</Label>
              <Input
                id="edit-endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPeriod}>Update Period</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
