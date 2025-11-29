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
import { Pencil, UserPlus, Link as LinkIcon, UserCheck, UserX } from 'lucide-react'
import {
  getUsers,
  updateUserRole,
  activateUser,
  deactivateUser,
  linkParentToStudent,
  getParentStudents,
  createUser,
} from '@/lib/sunday-school/users'
import { getChurches } from '@/lib/sunday-school/churches'
import { getDioceses } from '@/lib/sunday-school/dioceses'
import type { ExtendedUser, UserRole, Church, Diocese } from '@/lib/types/sunday-school'

export default function UsersPage() {
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [churches, setChurches] = useState<Church[]>([])
  const [dioceses, setDioceses] = useState<Diocese[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [churchFilter, setChurchFilter] = useState<string>('all')
  const [dioceseFilter, setDioceseFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Role assignment form
  const [roleFormData, setRoleFormData] = useState({
    role: '' as UserRole,
    diocese_id: '',
    church_id: '',
  })

  // Create user form
  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    role: 'student' as UserRole,
    username: '',
    full_name: '',
    diocese_id: '',
    church_id: '',
  })

  // Parent-student linking
  const [selectedParentId, setSelectedParentId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [parents, setParents] = useState<ExtendedUser[]>([])
  const [students, setStudents] = useState<ExtendedUser[]>([])

  useEffect(() => {
    loadData()
  }, [roleFilter, churchFilter, dioceseFilter])

  async function loadData() {
    try {
      setIsLoading(true)
      const filters: any = {}

      if (roleFilter !== 'all') filters.role = roleFilter as UserRole
      if (churchFilter !== 'all') filters.churchId = churchFilter
      if (dioceseFilter !== 'all') filters.dioceseId = dioceseFilter

      const [usersData, churchesData, diocesesData] = await Promise.all([
        getUsers(filters),
        getChurches(),
        getDioceses(),
      ])

      setUsers(usersData)
      setChurches(churchesData)
      setDioceses(diocesesData)

      // Load parents and students for linking
      const parentsData = usersData.filter(u => u.role === 'parent')
      const studentsData = usersData.filter(u => u.role === 'student')
      setParents(parentsData)
      setStudents(studentsData)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  function handleOpenRoleDialog(user: ExtendedUser) {
    setSelectedUser(user)
    setRoleFormData({
      role: user.role,
      diocese_id: user.diocese_id || '',
      church_id: user.church_id || '',
    })
    setIsRoleDialogOpen(true)
  }

  function handleOpenLinkDialog() {
    setSelectedParentId('')
    setSelectedStudentId('')
    setIsLinkDialogOpen(true)
  }

  async function handleUpdateRole() {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      await updateUserRole(
        selectedUser.id,
        roleFormData.role,
        roleFormData.diocese_id || null,
        roleFormData.church_id || null
      )
      toast.success('User role updated successfully')
      setIsRoleDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLinkParentToStudent() {
    if (!selectedParentId || !selectedStudentId) {
      toast.error('Please select both parent and student')
      return
    }

    setIsSubmitting(true)
    try {
      await linkParentToStudent(selectedParentId, selectedStudentId)
      toast.success('Parent linked to student successfully')
      setIsLinkDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Error linking parent to student:', error)
      toast.error('Failed to link parent to student')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(user: ExtendedUser) {
    try {
      if (user.is_active) {
        await deactivateUser(user.id)
        toast.success('User deactivated')
      } else {
        await activateUser(user.id)
        toast.success('User activated')
      }
      loadData()
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  function handleOpenCreateDialog() {
    setCreateFormData({
      email: '',
      password: '',
      role: 'student',
      username: '',
      full_name: '',
      diocese_id: '',
      church_id: '',
    })
    setIsCreateDialogOpen(true)
  }

  async function handleCreateUser() {
    if (!createFormData.email || !createFormData.password || !createFormData.role) {
      toast.error('Email, password, and role are required')
      return
    }

    setIsSubmitting(true)
    try {
      await createUser({
        email: createFormData.email,
        password: createFormData.password,
        role: createFormData.role,
        username: createFormData.username || undefined,
        full_name: createFormData.full_name || undefined,
        church_id: createFormData.church_id || undefined,
        diocese_id: createFormData.diocese_id || undefined,
      })
      toast.success('User created successfully')
      setIsCreateDialogOpen(false)
      loadData()
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Failed to create user')
    } finally {
      setIsSubmitting(false)
    }
  }

  function getDioceseName(dioceseId: string | null): string {
    if (!dioceseId) return '-'
    return dioceses.find(d => d.id === dioceseId)?.name || '-'
  }

  function getChurchName(churchId: string | null): string {
    if (!churchId) return '-'
    return churches.find(c => c.id === churchId)?.name || '-'
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    )
  })

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'destructive'
      case 'diocese_admin': return 'default'
      case 'church_admin': return 'secondary'
      case 'teacher': return 'outline'
      default: return 'secondary'
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground mt-2">
              Manage user roles and assignments
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleOpenLinkDialog}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Link Parent to Student
            </Button>
            <Button onClick={handleOpenCreateDialog}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="diocese_admin">Diocese Admin</SelectItem>
                    <SelectItem value="church_admin">Church Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Diocese</Label>
                <Select value={dioceseFilter} onValueChange={setDioceseFilter}>
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

              <div className="space-y-2">
                <Label>Church</Label>
                <Select value={churchFilter} onValueChange={setChurchFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Churches</SelectItem>
                    {churches.map((church) => (
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>A list of all users in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-4">Loading...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users found matching the filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Diocese</TableHead>
                      <TableHead>Church</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || user.username || '-'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{getDioceseName(user.diocese_id)}</TableCell>
                        <TableCell>{getChurchName(user.church_id)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenRoleDialog(user)}
                              title="Edit Role"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? (
                                <UserX className="h-4 w-4 text-destructive" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-green-600" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>
                Update role and organizational assignment for {selectedUser?.full_name || selectedUser?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={roleFormData.role}
                  onValueChange={(value) => setRoleFormData({ ...roleFormData, role: value as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="diocese_admin">Diocese Admin</SelectItem>
                    <SelectItem value="church_admin">Church Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(roleFormData.role === 'diocese_admin') && (
                <div className="space-y-2">
                  <Label>Diocese</Label>
                  <Select
                    value={roleFormData.diocese_id}
                    onValueChange={(value) => setRoleFormData({ ...roleFormData, diocese_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select diocese" />
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
              )}

              {(['church_admin', 'teacher', 'parent', 'student'].includes(roleFormData.role)) && (
                <div className="space-y-2">
                  <Label>Church</Label>
                  <Select
                    value={roleFormData.church_id}
                    onValueChange={(value) => setRoleFormData({ ...roleFormData, church_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select church" />
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
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRole} disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account with role and organizational assignment
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    placeholder="john_doe"
                    value={createFormData.username}
                    onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={createFormData.full_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={createFormData.role}
                  onValueChange={(value) => setCreateFormData({ ...createFormData, role: value as UserRole })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="church_admin">Church Admin</SelectItem>
                    <SelectItem value="diocese_admin">Diocese Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Diocese (optional)</Label>
                  <Select
                    value={createFormData.diocese_id || 'none'}
                    onValueChange={(value) => setCreateFormData({ ...createFormData, diocese_id: value === 'none' ? '' : value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select diocese" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {dioceses.map((diocese) => (
                        <SelectItem key={diocese.id} value={diocese.id}>
                          {diocese.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Church (optional)</Label>
                  <Select
                    value={createFormData.church_id || 'none'}
                    onValueChange={(value) => setCreateFormData({ ...createFormData, church_id: value === 'none' ? '' : value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select church" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {churches
                        .filter(c => !createFormData.diocese_id || c.diocese_id === createFormData.diocese_id)
                        .map((church) => (
                          <SelectItem key={church.id} value={church.id}>
                            {church.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Parent to Student Dialog */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Link Parent to Student</DialogTitle>
              <DialogDescription>
                Create a relationship between a parent and student account
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Parent *</Label>
                <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent" />
                  </SelectTrigger>
                  <SelectContent>
                    {parents.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.full_name || parent.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Student *</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name || student.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsLinkDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleLinkParentToStudent} disabled={isSubmitting}>
                {isSubmitting ? 'Linking...' : 'Link'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
