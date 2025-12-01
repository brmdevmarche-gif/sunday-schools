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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Users, UserPlus } from 'lucide-react'
import type { Class, CreateClassInput, Church, Diocese } from '@/lib/types/sunday-school'
import {
  createClassAction,
  updateClassAction,
  deleteClassAction,
  assignUserToClassAction,
  removeUserFromClassAction,
  getClassAssignmentsData,
  getAvailableTeachersData,
  getAvailableStudentsData,
} from './actions'

interface ClassWithCount extends Class {
  studentCount: number
}

interface User {
  id: string
  email: string
  full_name?: string | null
  username?: string | null
}

interface Assignment {
  id: string
  assignment_type: 'teacher' | 'student'
  user: User
}

interface ClassesClientProps {
  initialClasses: ClassWithCount[]
  churches: Church[]
  dioceses: Diocese[]
  userProfile: any
}

export default function ClassesClient({
  initialClasses,
  churches,
  dioceses,
  userProfile,
}: ClassesClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [selectedDioceseFilter, setSelectedDioceseFilter] = useState<string>('all')
  const [selectedChurchFilter, setSelectedChurchFilter] = useState<string>('all')
  const [classRoster, setClassRoster] = useState<Assignment[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [assignmentType, setAssignmentType] = useState<'teacher' | 'student'>('teacher')
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const [formData, setFormData] = useState<CreateClassInput>({
    church_id: '',
    name: '',
    description: '',
    grade_level: '',
    academic_year: '',
    schedule: '',
    capacity: 30,
  })

  function handleOpenDialog(cls?: Class) {
    if (cls) {
      setEditingClass(cls)
      setFormData({
        church_id: cls.church_id || '',
        name: cls.name,
        description: cls.description || '',
        grade_level: cls.grade_level || '',
        academic_year: cls.academic_year || '',
        schedule: cls.schedule || '',
        capacity: cls.capacity || 30,
      })
    } else {
      setEditingClass(null)
      setFormData({
        church_id: userProfile?.church_id || '',
        name: '',
        description: '',
        grade_level: '',
        academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        schedule: '',
        capacity: 30,
      })
    }
    setIsDialogOpen(true)
  }

  async function handleOpenAssignDialog(cls: Class, type: 'teacher' | 'student') {
    setSelectedClass(cls)
    setAssignmentType(type)
    setSelectedUserId('')

    try {
      const users =
        type === 'teacher'
          ? await getAvailableTeachersData(cls.church_id || '')
          : await getAvailableStudentsData(cls.church_id || '')

      setAvailableUsers(users)
      setIsAssignDialogOpen(true)
    } catch (error) {
      toast.error('Failed to load users')
    }
  }

  async function handleOpenRoster(cls: Class) {
    setSelectedClass(cls)

    try {
      const roster = await getClassAssignmentsData(cls.id)
      setClassRoster(roster as Assignment[])
      setIsRosterDialogOpen(true)
    } catch (error) {
      toast.error('Failed to load class roster')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingClass) {
        await updateClassAction(editingClass.id, formData)
        toast.success('Class updated successfully')
      } else {
        await createClassAction(formData)
        toast.success('Class created successfully')
      }

      setIsDialogOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error saving class:', error)
      toast.error(editingClass ? 'Failed to update class' : 'Failed to create class')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAssignUser() {
    if (!selectedClass || !selectedUserId) return

    setIsSubmitting(true)
    try {
      await assignUserToClassAction(selectedClass.id, selectedUserId, assignmentType)
      toast.success(`${assignmentType === 'teacher' ? 'Teacher' : 'Student'} assigned successfully`)
      setIsAssignDialogOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error assigning user:', error)
      toast.error('Failed to assign user to class')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRemoveUser(assignmentId: string) {
    if (!confirm('Are you sure you want to remove this user from the class?')) return

    try {
      await removeUserFromClassAction(assignmentId)
      toast.success('User removed from class')
      if (selectedClass) {
        const roster = await getClassAssignmentsData(selectedClass.id)
        setClassRoster(roster as Assignment[])
      }
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast.error('Failed to remove user')
    }
  }

  async function handleDelete(cls: Class) {
    if (!confirm(`Are you sure you want to delete "${cls.name}"?`)) {
      return
    }

    try {
      await deleteClassAction(cls.id)
      toast.success('Class deleted successfully')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Failed to delete class')
    }
  }

  function getChurchName(churchId: string | null): string {
    if (!churchId) return '-'
    const church = churches.find((c) => c.id === churchId)
    return church?.name || '-'
  }

  const filteredChurches =
    selectedDioceseFilter === 'all'
      ? churches
      : churches.filter((c) => c.diocese_id === selectedDioceseFilter)

  const filteredClasses = initialClasses.filter((cls) => {
    if (selectedChurchFilter !== 'all' && cls.church_id !== selectedChurchFilter) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground mt-2">Manage Sunday school classes and assignments</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
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

            <div className="flex-1 min-w-[200px]">
              <Label>Church</Label>
              <Select value={selectedChurchFilter} onValueChange={setSelectedChurchFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Churches</SelectItem>
                  {filteredChurches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes</CardTitle>
          <CardDescription>A list of all Sunday school classes</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No classes found. Create your first class to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Church</TableHead>
                  <TableHead>Grade Level</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>{getChurchName(cls.church_id)}</TableCell>
                    <TableCell>{cls.grade_level || '-'}</TableCell>
                    <TableCell>{cls.academic_year || '-'}</TableCell>
                    <TableCell className="text-sm">{cls.schedule || '-'}</TableCell>
                    <TableCell className="text-center">
                      {cls.studentCount}/{cls.capacity || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={cls.is_active ? 'default' : 'secondary'}>
                        {cls.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRoster(cls)}
                          title="View Roster"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAssignDialog(cls, 'teacher')}
                          title="Assign Teacher"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(cls)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cls)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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
              <DialogTitle>{editingClass ? 'Edit Class' : 'Create New Class'}</DialogTitle>
              <DialogDescription>
                {editingClass ? 'Update the class information below.' : 'Enter the details for the new class.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="church_id">Church *</Label>
                <Select
                  value={formData.church_id}
                  onValueChange={(value) => setFormData({ ...formData, church_id: value })}
                  required
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a church" />
                  </SelectTrigger>
                  <SelectContent>
                    {churches.map((church) => (
                      <SelectItem key={church.id} value={church.id}>
                        {church.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Class Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isSubmitting}
                  placeholder="e.g., Grade 1 - Sunday School"
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
                  <Label htmlFor="grade_level">Grade Level</Label>
                  <Input
                    id="grade_level"
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="e.g., Grade 1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="e.g., 2024-2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    disabled={isSubmitting}
                    placeholder="e.g., Sundays 10:00 AM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })}
                    disabled={isSubmitting}
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingClass ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign User Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {assignmentType === 'teacher' ? 'Teacher' : 'Student'}</DialogTitle>
            <DialogDescription>
              Select a {assignmentType} to assign to {selectedClass?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${assignmentType}`} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAssignUser} disabled={isSubmitting || !selectedUserId}>
              {isSubmitting ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Class Roster Dialog */}
      <Dialog open={isRosterDialogOpen} onOpenChange={setIsRosterDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Class Roster - {selectedClass?.name}</DialogTitle>
            <DialogDescription>Teachers and students assigned to this class</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Teachers Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Teachers</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedClass && handleOpenAssignDialog(selectedClass, 'teacher')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Teacher
                </Button>
              </div>
              <div className="border rounded-lg">
                {classRoster.filter((r) => r.assignment_type === 'teacher').length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No teachers assigned</p>
                ) : (
                  <Table>
                    <TableBody>
                      {classRoster
                        .filter((r) => r.assignment_type === 'teacher')
                        .map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>{assignment.user?.full_name || assignment.user?.email}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveUser(assignment.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            {/* Students Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Students</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectedClass && handleOpenAssignDialog(selectedClass, 'student')}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Student
                </Button>
              </div>
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {classRoster.filter((r) => r.assignment_type === 'student').length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No students enrolled</p>
                ) : (
                  <Table>
                    <TableBody>
                      {classRoster
                        .filter((r) => r.assignment_type === 'student')
                        .map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>{assignment.user?.full_name || assignment.user?.email}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveUser(assignment.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsRosterDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
