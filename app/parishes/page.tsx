"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Church, Search, Edit, Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Parish {
  id: string
  name: string
  city: string
  state: string
}

const mockParishes: Parish[] = [
  { id: "1", name: "St. Mary's Cathedral", city: "New York", state: "NY" },
  { id: "2", name: "Sacred Heart Parish", city: "Los Angeles", state: "CA" },
  { id: "3", name: "St. Joseph's Church", city: "Chicago", state: "IL" },
  { id: "4", name: "Holy Trinity Parish", city: "Houston", state: "TX" },
  { id: "5", name: "St. Michael's Church", city: "Phoenix", state: "AZ" },
  { id: "6", name: "Our Lady of Grace", city: "Philadelphia", state: "PA" },
  { id: "7", name: "St. Patrick's Cathedral", city: "Boston", state: "MA" },
  { id: "8", name: "Holy Family Parish", city: "Miami", state: "FL" },
]

export default function ParishesPage() {
  const [parishes, setParishes] = useState<Parish[]>(mockParishes)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingParish, setEditingParish] = useState<Parish | null>(null)
  const [newParish, setNewParish] = useState({ name: "", city: "", state: "" })
  const { toast } = useToast()

  const filteredParishes = parishes.filter(
    (parish) =>
      parish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parish.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parish.state.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddParish = () => {
    if (!newParish.name || !newParish.city || !newParish.state) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    const parish: Parish = {
      id: Date.now().toString(),
      ...newParish,
    }

    setParishes([...parishes, parish])
    setNewParish({ name: "", city: "", state: "" })
    setIsAddDialogOpen(false)
    toast({
      title: "Success",
      description: "Parish added successfully",
    })
  }

  const handleEditParish = (parish: Parish) => {
    setEditingParish(parish)
    setNewParish({ name: parish.name, city: parish.city, state: parish.state })
  }

  const handleUpdateParish = () => {
    if (!editingParish || !newParish.name || !newParish.city || !newParish.state) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setParishes(parishes.map((p) => (p.id === editingParish.id ? { ...p, ...newParish } : p)))
    setEditingParish(null)
    setNewParish({ name: "", city: "", state: "" })
    toast({
      title: "Success",
      description: "Parish updated successfully",
    })
  }

  const handleDeleteParish = (parishId: string) => {
    setParishes(parishes.filter((p) => p.id !== parishId))
    toast({
      title: "Success",
      description: "Parish deleted successfully",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Parishes"
          description="Manage parish locations and information"
          icon={<Church className="h-6 w-6" />}
          actionButton={{
            label: "Add Parish",
            onClick: () => setIsAddDialogOpen(true),
          }}
        />

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search parishes..."
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
                    <TableHead>Parish Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParishes.map((parish) => (
                    <TableRow key={parish.id}>
                      <TableCell className="font-medium">{parish.name}</TableCell>
                      <TableCell>{parish.city}</TableCell>
                      <TableCell>{parish.state}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditParish(parish)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteParish(parish.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredParishes.length === 0 && (
              <div className="text-center py-8 text-gray-500">No parishes found matching your search.</div>
            )}
          </CardContent>
        </Card>

        {/* Add Parish Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Parish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Parish Name</Label>
                <Input
                  id="name"
                  value={newParish.name}
                  onChange={(e) => setNewParish({ ...newParish, name: e.target.value })}
                  placeholder="Enter parish name"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={newParish.city}
                  onChange={(e) => setNewParish({ ...newParish, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={newParish.state}
                  onChange={(e) => setNewParish({ ...newParish, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddParish}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Parish
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Parish Dialog */}
        <Dialog open={!!editingParish} onOpenChange={() => setEditingParish(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Parish</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Parish Name</Label>
                <Input
                  id="edit-name"
                  value={newParish.name}
                  onChange={(e) => setNewParish({ ...newParish, name: e.target.value })}
                  placeholder="Enter parish name"
                />
              </div>
              <div>
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={newParish.city}
                  onChange={(e) => setNewParish({ ...newParish, city: e.target.value })}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={newParish.state}
                  onChange={(e) => setNewParish({ ...newParish, state: e.target.value })}
                  placeholder="Enter state"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingParish(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateParish}>
                  <Edit className="h-4 w-4 mr-1" />
                  Update Parish
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
