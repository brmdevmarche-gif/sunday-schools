'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
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
import { Plus, Pencil, Trash2, Users, UserPlus, Search, Download, Copy, Power, BarChart3, CheckCircle2, XCircle, Database } from 'lucide-react'
import {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassStudentsCount,
  getClassTeachersCount,
  getClassAssignments,
  assignUserToClass,
  removeUserFromClass,
  toggleClassStatus,
  bulkAssignUsersToClass,
  bulkRemoveUsersFromClass,
  searchClasses,
  getClassStatistics,
  duplicateClass,
  exportClassRoster,
  checkClassCapacity,
} from '@/lib/sunday-school/classes'
import { getChurches } from '@/lib/sunday-school/churches'
import { getDioceses } from '@/lib/sunday-school/dioceses'
import { getAvailableTeachers, getStudents } from '@/lib/sunday-school/users'
import { getCurrentUserProfile } from '@/lib/sunday-school/users'
import type { Class, CreateClassInput, Church, Diocese } from '@/lib/types/sunday-school'

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [dioceses, setDioceses] = useState<Diocese[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isRosterDialogOpen, setIsRosterDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [selectedDioceseFilter, setSelectedDioceseFilter] = useState<string>('all')
  const [selectedChurchFilter, setSelectedChurchFilter] = useState<string>('all')
  const [classRoster, setClassRoster] = useState<any[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [assignmentType, setAssignmentType] = useState<'teacher' | 'student'>('teacher')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [teacherCounts, setTeacherCounts] = useState<Record<string, number>>({})
  const [isBulkAssignDialogOpen, setIsBulkAssignDialogOpen] = useState(false)
  const [isStatisticsDialogOpen, setIsStatisticsDialogOpen] = useState(false)
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false)
  const [classStatistics, setClassStatistics] = useState<any>(null)
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicateYear, setDuplicateYear] = useState('')
  const [copyAssignments, setCopyAssignments] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  const [formData, setFormData] = useState<CreateClassInput>({
    church_id: '',
    name: '',
    description: '',
    grade_level: '',
    academic_year: '',
    schedule: '',
    capacity: 30,
  })

  useEffect(() => {
    loadData()
  }, [selectedChurchFilter])

  async function loadData() {
    try {
      setIsLoading(true)
      const [profile, classesData, churchesData, diocesesData] = await Promise.all([
        getCurrentUserProfile(),
        getClasses(selectedChurchFilter === 'all' ? undefined : selectedChurchFilter),
        getChurches(),
        getDioceses(),
      ])

      setUserProfile(profile)
      setClasses(classesData)
      setChurches(churchesData)
      setDioceses(diocesesData)

      // Load student and teacher counts
      const studentCountsData: Record<string, number> = {}
      const teacherCountsData: Record<string, number> = {}
      await Promise.all(
        classesData.map(async (cls) => {
          studentCountsData[cls.id] = await getClassStudentsCount(cls.id)
          teacherCountsData[cls.id] = await getClassTeachersCount(cls.id)
        })
      )
      setStudentCounts(studentCountsData)
      setTeacherCounts(teacherCountsData)
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error('Failed to load classes')
    } finally {
      setIsLoading(false)
    }
  }

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

  async function handleOpenAssignDialog(cls: Class, type: 'teacher' | 'student', bulk: boolean = false) {
    setSelectedClass(cls)
    setAssignmentType(type)
    setSelectedUserId('')
    setSelectedUserIds([])

    try {
      if (!cls.church_id) {
        toast.error('Class must have a church assigned')
        return
      }

      // Load available users (exclude already assigned to this class)
      const users = type === 'teacher'
        ? await getAvailableTeachers(cls.church_id, cls.id)
        : await getStudents(cls.church_id, cls.id)

      console.log(`Loaded ${users.length} ${type}s for church ${cls.church_id}`)
      console.log('Available users:', users.map(u => ({ name: u.full_name, email: u.email, church_id: u.church_id })))
      
      if (users.length === 0) {
        // Debug: Check what users exist
        try {
          const debugResponse = await fetch(`/api/admin/debug-users?churchId=${cls.church_id}&role=${type}`)
          const debugData = await debugResponse.json()
          console.log(`Debug: Found ${debugData.count} ${type}s in database for church ${cls.church_id}`)
          console.log('Debug users:', debugData.users)
          
          if (debugData.count > 0) {
            toast.warning(`Found ${debugData.count} ${type}s in database, but they may already be assigned to this class or have RLS restrictions.`)
          } else {
            toast.warning(`No ${type}s found for this church. Please create users first or check if they're linked to the correct church.`)
          }
        } catch (debugError) {
          toast.warning(`No available ${type}s found. Check console for details.`)
        }
      }

      setAvailableUsers(users)
      if (bulk) {
        setIsBulkAssignDialogOpen(true)
      } else {
        setIsAssignDialogOpen(true)
      }
    } catch (error: any) {
      console.error('Error loading users:', error)
      toast.error(`Failed to load ${type}s: ${error.message || 'Unknown error'}`)
    }
  }

  async function handleOpenRoster(cls: Class) {
    setSelectedClass(cls)

    try {
      const roster = await getClassAssignments(cls.id)
      setClassRoster(roster)
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
        await updateClass(editingClass.id, formData)
        toast.success('Class updated successfully')
      } else {
        await createClass(formData)
        toast.success('Class created successfully')
      }

      setIsDialogOpen(false)
      loadData()
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
      await assignUserToClass(selectedClass.id, selectedUserId, assignmentType)
      toast.success(`${assignmentType === 'teacher' ? 'Teacher' : 'Student'} assigned successfully`)
      setIsAssignDialogOpen(false)
      loadData()
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
      await removeUserFromClass(assignmentId)
      toast.success('User removed from class')
      if (selectedClass) {
        const roster = await getClassAssignments(selectedClass.id)
        setClassRoster(roster)
      }
      loadData()
    } catch (error) {
      toast.error('Failed to remove user')
    }
  }

  async function handleDelete(cls: Class) {
    if (!confirm(`Are you sure you want to delete "${cls.name}"?`)) {
      return
    }

    try {
      await deleteClass(cls.id)
      toast.success('Class deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('Failed to delete class')
    }
  }

  async function handleToggleStatus(cls: Class) {
    try {
      await toggleClassStatus(cls.id, !cls.is_active)
      toast.success(`Class ${cls.is_active ? 'deactivated' : 'activated'} successfully`)
      loadData()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('Failed to update class status')
    }
  }

  async function handleBulkAssign() {
    if (!selectedClass || selectedUserIds.length === 0) return

    setIsSubmitting(true)
    try {
      await bulkAssignUsersToClass(selectedClass.id, selectedUserIds, assignmentType)
      toast.success(`${selectedUserIds.length} ${assignmentType}s assigned successfully`)
      setIsBulkAssignDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Error bulk assigning users:', error)
      toast.error('Failed to assign users')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSearch() {
    if (!searchTerm.trim()) {
      loadData()
      return
    }

    try {
      setIsLoading(true)
      const results = await searchClasses(searchTerm, {
        churchId: selectedChurchFilter === 'all' ? undefined : selectedChurchFilter,
        dioceseId: selectedDioceseFilter === 'all' ? undefined : selectedDioceseFilter,
      })
      setClasses(results)
      
      // Load counts for search results
      const studentCountsData: Record<string, number> = {}
      const teacherCountsData: Record<string, number> = {}
      await Promise.all(
        results.map(async (cls) => {
          studentCountsData[cls.id] = await getClassStudentsCount(cls.id)
          teacherCountsData[cls.id] = await getClassTeachersCount(cls.id)
        })
      )
      setStudentCounts(studentCountsData)
      setTeacherCounts(teacherCountsData)
    } catch (error) {
      console.error('Error searching classes:', error)
      toast.error('Failed to search classes')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleExportRoster(cls: Class, format: 'csv' | 'json' = 'csv') {
    try {
      const data = await exportClassRoster(cls.id, format)
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${cls.name.replace(/\s+/g, '_')}_roster.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Roster exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Error exporting roster:', error)
      toast.error('Failed to export roster')
    }
  }

  async function handleViewStatistics(cls: Class) {
    try {
      const stats = await getClassStatistics(cls.id)
      setClassStatistics(stats)
      setSelectedClass(cls)
      setIsStatisticsDialogOpen(true)
    } catch (error) {
      console.error('Error loading statistics:', error)
      toast.error('Failed to load statistics')
    }
  }

  async function handleDuplicateClass() {
    if (!selectedClass || !duplicateName.trim()) {
      toast.error('Please enter a name for the duplicate class')
      return
    }

    setIsSubmitting(true)
    try {
      await duplicateClass(selectedClass.id, duplicateName, duplicateYear || undefined, copyAssignments)
      toast.success('Class duplicated successfully')
      setIsDuplicateDialogOpen(false)
      setDuplicateName('')
      setDuplicateYear('')
      setCopyAssignments(false)
      loadData()
    } catch (error) {
      console.error('Error duplicating class:', error)
      toast.error('Failed to duplicate class')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCheckCapacity(cls: Class) {
    try {
      const capacity = await checkClassCapacity(cls.id)
      if (capacity.isFull) {
        toast.warning(`Class is full: ${capacity.current}/${capacity.capacity} students`)
      } else {
        toast.info(`Capacity: ${capacity.current}/${capacity.capacity} (${capacity.available} spots available)`)
      }
    } catch (error) {
      console.error('Error checking capacity:', error)
      toast.error('Failed to check capacity')
    }
  }

  async function handleSeedDummyUsers() {
    if (!confirm('This will create 5 teachers and 15 students. Continue?')) {
      return
    }

    setIsSeeding(true)
    try {
      const churchId = selectedChurchFilter === 'all' ? undefined : selectedChurchFilter
      const response = await fetch('/api/admin/seed-dummy-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ churchId }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Successfully created ${result.created} users!`)
        if (result.errors && result.errors.length > 0) {
          console.warn('Some users failed to create:', result.errors)
        }
      } else {
        toast.error(`Created ${result.created} users, but ${result.failed} failed. Check console for details.`)
        console.error('Seed errors:', result.errors)
      }
    } catch (error) {
      console.error('Error seeding users:', error)
      toast.error('Failed to seed dummy users')
    } finally {
      setIsSeeding(false)
    }
  }

  async function handleSeedAllData() {
    if (!confirm('This will create:\n- Diocese & Church (if needed)\n- 5 teachers\n- 15 students\n- 5 classes\n- Assignments\n\nContinue?')) {
      return
    }

    setIsSeeding(true)
    try {
      const churchId = selectedChurchFilter === 'all' ? undefined : selectedChurchFilter
      const response = await fetch('/api/admin/seed-all-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          churchId,
          createDiocese: true,
          createChurch: true,
        }),
      })

      const result = await response.json()

      if (result.success) {
        const summary = [
          `Diocese: ${result.diocese?.name || 'Using existing'}`,
          `Church: ${result.church?.name || 'Using existing'}`,
          `Teachers: ${result.teachers.created}`,
          `Students: ${result.students.created}`,
          `Classes: ${result.classes.created}`,
          `Assignments: ${result.assignments.teachers} teachers, ${result.assignments.students} students`,
        ].join('\n')
        
        toast.success(`Complete dummy data seeded successfully!`, {
          description: summary,
          duration: 5000,
        })
        
        if (result.errors && result.errors.length > 0) {
          console.warn('Some items failed:', result.errors)
        }
        
        // Reload data to show new classes and assignments
        loadData()
      } else {
        toast.error(`Seeded with errors. Check console for details.`)
        console.error('Seed errors:', result.errors)
        loadData() // Still reload to show what was created
      }
    } catch (error) {
      console.error('Error seeding all data:', error)
      toast.error('Failed to seed dummy data')
    } finally {
      setIsSeeding(false)
    }
  }

  function getChurchName(churchId: string | null): string {
    if (!churchId) return '-'
    const church = churches.find(c => c.id === churchId)
    return church?.name || '-'
  }

  const filteredChurches = selectedDioceseFilter === 'all'
    ? churches
    : churches.filter(c => c.diocese_id === selectedDioceseFilter)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Classes</h1>
            <p className="text-muted-foreground mt-2">
              Manage Sunday school classes and assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSeedAllData}
              disabled={isSeeding}
              title="Seed complete dummy data (diocese, church, users, classes, assignments)"
            >
              <Database className="mr-2 h-4 w-4" />
              {isSeeding ? 'Seeding...' : 'Seed All Data'}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                // Debug: Check users in database
                try {
                  const churches = await getChurches()
                  if (churches.length === 0) {
                    toast.error('No churches found. Please create a church first.')
                    return
                  }
                  const churchId = selectedChurchFilter === 'all' ? churches[0].id : selectedChurchFilter
                  
                  const [teachers, students] = await Promise.all([
                    getAvailableTeachers(churchId),
                    getStudents(churchId),
                  ])
                  
                  console.log('Debug - Teachers:', teachers)
                  console.log('Debug - Students:', students)
                  
                  toast.info(`Found ${teachers.length} teachers and ${students.length} students for church`, {
                    description: `Church ID: ${churchId}`,
                    duration: 5000,
                  })
                } catch (error: any) {
                  console.error('Debug error:', error)
                  toast.error(`Debug failed: ${error.message}`)
                }
              }}
              title="Debug: Check if users exist in database"
            >
              <Search className="mr-2 h-4 w-4" />
              Debug Users
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search classes by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {searchTerm && (
                  <Button onClick={() => { setSearchTerm(''); loadData(); }} variant="outline">
                    Clear
                  </Button>
                )}
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
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-4">Loading...</p>
              </div>
            ) : classes.length === 0 ? (
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
                    <TableHead className="text-center">Teachers</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{getChurchName(cls.church_id)}</TableCell>
                      <TableCell>{cls.grade_level || '-'}</TableCell>
                      <TableCell>{cls.academic_year || '-'}</TableCell>
                      <TableCell className="text-sm">{cls.schedule || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span>{studentCounts[cls.id] || 0}/{cls.capacity || '-'}</span>
                          {cls.capacity && (
                            <button
                              onClick={() => handleCheckCapacity(cls)}
                              className="text-xs text-muted-foreground hover:text-primary mt-1"
                              title="Check capacity"
                            >
                              Check
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {teacherCounts[cls.id] || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cls.is_active ? 'default' : 'secondary'}>
                          {cls.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
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
                            onClick={() => handleViewStatistics(cls)}
                            title="View Statistics"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAssignDialog(cls, 'teacher')}
                            title="Assign Teacher"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAssignDialog(cls, 'student')}
                            title="Assign Student"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(cls)}
                            title={cls.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {cls.is_active ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedClass(cls)
                              setDuplicateName(`${cls.name} (Copy)`)
                              setDuplicateYear('')
                              setIsDuplicateDialogOpen(true)
                            }}
                            title="Duplicate Class"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportRoster(cls, 'csv')}
                            title="Export Roster (CSV)"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(cls)}
                            title="Edit Class"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cls)}
                            title="Delete Class"
                          >
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
                <DialogTitle>
                  {editingClass ? 'Edit Class' : 'Create New Class'}
                </DialogTitle>
                <DialogDescription>
                  {editingClass
                    ? 'Update the class information below.'
                    : 'Enter the details for the new class.'}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
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
              <DialogTitle>
                Assign {assignmentType === 'teacher' ? 'Teacher' : 'Student'}
              </DialogTitle>
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
              <Button
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
                disabled={isSubmitting}
              >
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
              <DialogDescription>
                Teachers and students assigned to this class
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Teachers Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Teachers</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedClass && handleOpenAssignDialog(selectedClass, 'teacher', true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Bulk Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedClass && handleOpenAssignDialog(selectedClass, 'teacher')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Teacher
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg">
                  {classRoster.filter(r => r.assignment_type === 'teacher').length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4">No teachers assigned</p>
                  ) : (
                    <Table>
                      <TableBody>
                        {classRoster.filter(r => r.assignment_type === 'teacher').map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              {assignment.user?.full_name || assignment.user?.email}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveUser(assignment.id)}
                              >
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedClass && handleOpenAssignDialog(selectedClass, 'student', true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Bulk Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => selectedClass && handleOpenAssignDialog(selectedClass, 'student')}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Student
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {classRoster.filter(r => r.assignment_type === 'student').length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4">No students enrolled</p>
                  ) : (
                    <Table>
                      <TableBody>
                        {classRoster.filter(r => r.assignment_type === 'student').map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              {assignment.user?.full_name || assignment.user?.email}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveUser(assignment.id)}
                              >
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

            <DialogFooter className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedClass && handleExportRoster(selectedClass, 'csv')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedClass && handleExportRoster(selectedClass, 'json')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export JSON
                </Button>
              </div>
              <Button onClick={() => setIsRosterDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Assign Dialog */}
        <Dialog open={isBulkAssignDialogOpen} onOpenChange={setIsBulkAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Bulk Assign {assignmentType === 'teacher' ? 'Teachers' : 'Students'}
              </DialogTitle>
              <DialogDescription>
                Select multiple {assignmentType}s to assign to {selectedClass?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
              {availableUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    checked={selectedUserIds.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds([...selectedUserIds, user.id])
                      } else {
                        setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))
                      }
                    }}
                    className="rounded"
                  />
                  <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                    {user.full_name || user.email}
                  </label>
                </div>
              ))}
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No available {assignmentType}s found
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsBulkAssignDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAssign}
                disabled={isSubmitting || selectedUserIds.length === 0}
              >
                {isSubmitting ? 'Assigning...' : `Assign ${selectedUserIds.length} ${assignmentType}s`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Statistics Dialog */}
        <Dialog open={isStatisticsDialogOpen} onOpenChange={setIsStatisticsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Class Statistics - {selectedClass?.name}</DialogTitle>
              <DialogDescription>
                Comprehensive statistics for this class
              </DialogDescription>
            </DialogHeader>

            {classStatistics && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Students</p>
                    <p className="text-2xl font-bold">{classStatistics.studentsCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Teachers</p>
                    <p className="text-2xl font-bold">{classStatistics.teachersCount}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="text-2xl font-bold">{classStatistics.capacity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Enrollment Rate</p>
                    <p className="text-2xl font-bold">{classStatistics.enrollmentRate}%</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">Lessons</p>
                    <p className="text-2xl font-bold">{classStatistics.lessonsCount}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Enrollment:</span>
                      <span className="font-medium">
                        {classStatistics.studentsCount} / {classStatistics.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(classStatistics.enrollmentRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsStatisticsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate Class Dialog */}
        <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Duplicate Class</DialogTitle>
              <DialogDescription>
                Create a copy of {selectedClass?.name} for a new academic year
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="duplicate-name">New Class Name *</Label>
                <Input
                  id="duplicate-name"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="e.g., Grade 1 - 2025-2026"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duplicate-year">Academic Year</Label>
                <Input
                  id="duplicate-year"
                  value={duplicateYear}
                  onChange={(e) => setDuplicateYear(e.target.value)}
                  placeholder="e.g., 2025-2026"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="copy-assignments"
                  checked={copyAssignments}
                  onChange={(e) => setCopyAssignments(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="copy-assignments" className="text-sm cursor-pointer">
                  Copy teachers and students assignments
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDuplicateDialogOpen(false)
                  setDuplicateName('')
                  setDuplicateYear('')
                  setCopyAssignments(false)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDuplicateClass}
                disabled={isSubmitting || !duplicateName.trim()}
              >
                {isSubmitting ? 'Duplicating...' : 'Duplicate Class'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
