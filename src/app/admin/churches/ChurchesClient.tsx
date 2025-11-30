'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Church, CreateChurchInput, Diocese } from '@/lib/types/sunday-school'
import {
  createChurchAction,
  updateChurchAction,
  deleteChurchAction,
} from './actions'

interface ChurchWithCount extends Church {
  classCount: number
}

interface ChurchesClientProps {
  initialChurches: ChurchWithCount[]
  dioceses: Diocese[]
}

export default function ChurchesClient({ initialChurches, dioceses }: ChurchesClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingChurch, setEditingChurch] = useState<Church | null>(null)
  const [selectedDioceseFilter, setSelectedDioceseFilter] = useState<string>('all')
  const [formData, setFormData] = useState<CreateChurchInput>({
    diocese_id: '',
    name: '',
    description: '',
    address: '',
    city: '',
    contact_email: '',
    contact_phone: '',
  })

  function handleOpenDialog(church?: Church) {
    if (church) {
      setEditingChurch(church)
      setFormData({
        diocese_id: church.diocese_id || '',
        name: church.name,
        description: church.description || '',
        address: church.address || '',
        city: church.city || '',
        contact_email: church.contact_email || '',
        contact_phone: church.contact_phone || '',
      })
    } else {
      setEditingChurch(null)
      setFormData({
        diocese_id: '',
        name: '',
        description: '',
        address: '',
        city: '',
        contact_email: '',
        contact_phone: '',
      })
    }
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingChurch) {
        await updateChurchAction(editingChurch.id, formData)
        toast.success('Church updated successfully')
      } else {
        await createChurchAction(formData)
        toast.success('Church created successfully')
      }

      setIsDialogOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error saving church:', error)
      toast.error(editingChurch ? 'Failed to update church' : 'Failed to create church')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(church: Church) {
    if (!confirm(`Are you sure you want to delete "${church.name}"? This will also delete all associated classes.`)) {
      return
    }

    try {
      await deleteChurchAction(church.id)
      toast.success('Church deleted successfully')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error deleting church:', error)
      toast.error('Failed to delete church')
    }
  }

  function getDioceseName(dioceseId: string | null): string {
    if (!dioceseId) return '-'
    const diocese = dioceses.find(d => d.id === dioceseId)
    return diocese?.name || '-'
  }

  // Filter churches
  const filteredChurches = selectedDioceseFilter === 'all'
    ? initialChurches
    : initialChurches.filter(c => c.diocese_id === selectedDioceseFilter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Churches</h1>
          <p className="text-muted-foreground mt-2">
            Manage churches and their classes
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Church
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label>Diocese</Label>
              <Select value={selectedDioceseFilter} onValueChange={setSelectedDioceseFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dioceses</SelectItem>
                  {dioceses.map((diocese) => (
                    <SelectItem key={diocese.id} value={diocese.id}>
                      {diocese.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Churches Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Churches</CardTitle>
          <CardDescription>A list of all churches in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredChurches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No churches found. Create your first church to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Diocese</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Classes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChurches.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell className="font-medium">{church.name}</TableCell>
                    <TableCell>{getDioceseName(church.diocese_id)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {church.city && <div>{church.city}</div>}
                        {church.address && <div className="text-muted-foreground">{church.address}</div>}
                        {!church.city && !church.address && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {church.contact_email && <div>{church.contact_email}</div>}
                        {church.contact_phone && <div>{church.contact_phone}</div>}
                        {!church.contact_email && !church.contact_phone && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {church.classCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(church)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(church)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingChurch ? 'Edit Church' : 'Create New Church'}
              </DialogTitle>
              <DialogDescription>
                {editingChurch
                  ? 'Update the church information below.'
                  : 'Enter the details for the new church.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="diocese_id">Diocese *</Label>
                <Select
                  value={formData.diocese_id}
                  onValueChange={(value) => setFormData({ ...formData, diocese_id: value })}
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a diocese" />
                  </SelectTrigger>
                  <SelectContent>
                    {dioceses.map((diocese) => (
                      <SelectItem key={diocese.id} value={diocese.id}>
                        {diocese.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                  placeholder="e.g., St. Mary Church"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="Brief description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="e.g., Alexandria"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="123 Main Street"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="email@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingChurch ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
