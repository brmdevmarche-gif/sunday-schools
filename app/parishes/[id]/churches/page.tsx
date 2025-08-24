"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Church {
  id: string
  name: string
  city: string
  state: string
  parishId: string
}

interface Parish {
  id: string
  name: string
  city: string
  state: string
}

// Mock data for development
const mockParish: Parish = {
  id: "1",
  name: "St. Mary's Parish",
  city: "Springfield",
  state: "IL",
}

const mockChurches: Church[] = [
  { id: "1", name: "St. Mary's Cathedral", city: "Springfield", state: "IL", parishId: "1" },
  { id: "2", name: "Holy Cross Church", city: "Springfield", state: "IL", parishId: "1" },
  { id: "3", name: "Sacred Heart Chapel", city: "Springfield", state: "IL", parishId: "1" },
  { id: "4", name: "St. Joseph's Church", city: "Springfield", state: "IL", parishId: "1" },
  { id: "5", name: "Our Lady of Peace", city: "Springfield", state: "IL", parishId: "1" },
]

export default function ChurchesPage({ params }: { params: { id: string } }) {
  const [churches, setChurches] = useState<Church[]>(mockChurches)
  const [parish] = useState<Parish>(mockParish)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingChurch, setEditingChurch] = useState<Church | null>(null)
  const [newChurch, setNewChurch] = useState({ name: "", city: "", state: "" })
  const { toast } = useToast()

  const filteredChurches = churches.filter(
    (church) =>
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.state.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddChurch = () => {
    if (!newChurch.name || !newChurch.city || !newChurch.state) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const church: Church = {
      id: Date.now().toString(),
      name: newChurch.name,
      city: newChurch.city,
      state: newChurch.state,
      parishId: params.id,
    }

    setChurches([...churches, church])
    setNewChurch({ name: "", city: "", state: "" })
    setIsAddDialogOpen(false)
    toast({
      title: "Success",
      description: "Church added successfully",
    })
  }

  const handleEditChurch = () => {
    if (!editingChurch) return

    setChurches(churches.map((church) => (church.id === editingChurch.id ? editingChurch : church)))
    setEditingChurch(null)
    setIsEditDialogOpen(false)
    toast({
      title: "Success",
      description: "Church updated successfully",
    })
  }

  const handleDeleteChurch = (churchId: string) => {
    setChurches(churches.filter((church) => church.id !== churchId))
    toast({
      title: "Success",
      description: "Church deleted successfully",
    })
  }

  const openEditDialog = (church: Church) => {
    setEditingChurch({ ...church })
    setIsEditDialogOpen(true)
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
            <BreadcrumbLink href={`/parishes/${params.id}`}>{parish.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Churches</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={`Churches in ${parish.name}`}
        description="Manage churches within this parish"
        icon={Plus}
        action={
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Church
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Church</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Church Name</Label>
                  <Input
                    id="name"
                    value={newChurch.name}
                    onChange={(e) => setNewChurch({ ...newChurch, name: e.target.value })}
                    placeholder="Enter church name"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={newChurch.city}
                    onChange={(e) => setNewChurch({ ...newChurch, city: e.target.value })}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={newChurch.state}
                    onChange={(e) => setNewChurch({ ...newChurch, state: e.target.value })}
                    placeholder="Enter state"
                  />
                </div>
                <Button onClick={handleAddChurch} className="w-full">
                  Add Church
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search churches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Church Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChurches.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell className="font-medium">{church.name}</TableCell>
                    <TableCell>{church.city}</TableCell>
                    <TableCell>{church.state}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(church)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteChurch(church.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredChurches.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No churches found
                    </TableCell>
                  </TableRow>
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
            <DialogTitle>Edit Church</DialogTitle>
          </DialogHeader>
          {editingChurch && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Church Name</Label>
                <Input
                  id="edit-name"
                  value={editingChurch.name}
                  onChange={(e) => setEditingChurch({ ...editingChurch, name: e.target.value })}
                  placeholder="Enter church name"
                />
              </div>
              <div>
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editingChurch.city}
                  onChange={(e) => setEditingChurch({ ...editingChurch, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={editingChurch.state}
                  onChange={(e) => setEditingChurch({ ...editingChurch, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
              <Button onClick={handleEditChurch} className="w-full">
                Update Church
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
