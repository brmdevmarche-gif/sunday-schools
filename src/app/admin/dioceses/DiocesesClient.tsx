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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Diocese, CreateDioceseInput } from '@/lib/types/sunday-school'
import {
  createDioceseAction,
  updateDioceseAction,
  deleteDioceseAction,
} from './actions'

interface DioceseWithCount extends Diocese {
  churchCount: number
}

interface DiocesesClientProps {
  initialDioceses: DioceseWithCount[]
}

export default function DiocesesClient({ initialDioceses }: DiocesesClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingDiocese, setEditingDiocese] = useState<Diocese | null>(null)
  const [formData, setFormData] = useState<CreateDioceseInput>({
    name: '',
    description: '',
    location: '',
    contact_email: '',
    contact_phone: '',
  })

  function handleOpenDialog(diocese?: Diocese) {
    if (diocese) {
      setEditingDiocese(diocese)
      setFormData({
        name: diocese.name,
        description: diocese.description || '',
        location: diocese.location || '',
        contact_email: diocese.contact_email || '',
        contact_phone: diocese.contact_phone || '',
      })
    } else {
      setEditingDiocese(null)
      setFormData({
        name: '',
        description: '',
        location: '',
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
      if (editingDiocese) {
        await updateDioceseAction(editingDiocese.id, formData)
        toast.success('Diocese updated successfully')
      } else {
        await createDioceseAction(formData)
        toast.success('Diocese created successfully')
      }

      setIsDialogOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error saving diocese:', error)
      toast.error(editingDiocese ? 'Failed to update diocese' : 'Failed to create diocese')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(diocese: Diocese) {
    if (!confirm(`Are you sure you want to delete "${diocese.name}"? This will also delete all associated churches and classes.`)) {
      return
    }

    try {
      await deleteDioceseAction(diocese.id)
      toast.success('Diocese deleted successfully')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error deleting diocese:', error)
      toast.error('Failed to delete diocese')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dioceses</h1>
          <p className="text-muted-foreground mt-2">
            Manage dioceses and their associated churches
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Diocese
        </Button>
      </div>

      {/* Dioceses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Dioceses</CardTitle>
          <CardDescription>A list of all dioceses in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {initialDioceses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No dioceses found. Create your first diocese to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Churches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialDioceses.map((diocese) => (
                  <TableRow key={diocese.id}>
                    <TableCell className="font-medium">{diocese.name}</TableCell>
                    <TableCell>{diocese.location || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {diocese.contact_email && <div>{diocese.contact_email}</div>}
                        {diocese.contact_phone && <div>{diocese.contact_phone}</div>}
                        {!diocese.contact_email && !diocese.contact_phone && '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {diocese.churchCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(diocese)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(diocese)}
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
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingDiocese ? 'Edit Diocese' : 'Create New Diocese'}
              </DialogTitle>
              <DialogDescription>
                {editingDiocese
                  ? 'Update the diocese information below.'
                  : 'Enter the details for the new diocese.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                  placeholder="e.g., Diocese of Alexandria"
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

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isSubmitting}
                  placeholder="e.g., Alexandria, Egypt"
                />
              </div>

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
                {isSubmitting ? 'Saving...' : editingDiocese ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
