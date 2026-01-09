'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Users,
  Activity,
  Shield,
  Pencil,
  UserCheck,
  UserX,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  Home,
} from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import Link from 'next/link'
import { toast } from 'sonner'
import type { ExtendedUser, UserRole, AttendanceStatus } from '@/lib/types/sunday-school'
import {
  updateUserRoleAction,
  activateUserAction,
  deactivateUserAction,
  changeUserPasswordAction,
} from '../actions'

interface ClassAssignment {
  id: string
  assignment_type: 'student' | 'teacher'
  class: {
    id: string
    name: string
    grade_level: string | null
    church: {
      name: string
    } | null
  } | null
}

interface AttendanceRecord {
  id: string
  attendance_date: string
  status: AttendanceStatus
  notes: string | null
  class: {
    name: string
  } | null
}

interface Relationship {
  id: string
  relationship_type: string
  parent: {
    id: string
    full_name: string | null
    email: string
  } | null
  student: {
    id: string
    full_name: string | null
    email: string
  } | null
}

interface LoginRecord {
  id: string
  login_at: string
  ip_address: string | null
  user_agent: string | null
}

interface Church {
  id: string
  name: string
  diocese_id: string | null
}

interface Diocese {
  id: string
  name: string
}

interface UserDetailsClientProps {
  user: ExtendedUser & {
    diocese: { id: string; name: string } | null
    church: { id: string; name: string } | null
  }
  classAssignments: ClassAssignment[]
  attendanceRecords: AttendanceRecord[]
  relationships: Relationship[]
  loginHistory: LoginRecord[]
  currentUserRole: UserRole
  churches: Church[]
  dioceses: Diocese[]
}

export default function UserDetailsClient({
  user,
  classAssignments,
  attendanceRecords,
  relationships,
  loginHistory,
  currentUserRole,
  churches,
  dioceses,
}: UserDetailsClientProps) {
  const router = useRouter()
  const t = useTranslations()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editFormData, setEditFormData] = useState({
    full_name: user.full_name || '',
    username: user.username || '',
    email: user.email,
    role: user.role,
    diocese_id: user.diocese_id || '',
    church_id: user.church_id || '',
  })
  const [passwordFormData, setPasswordFormData] = useState({
    adminPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [identityVerified, setIdentityVerified] = useState(false)

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'destructive'
      case 'diocese_admin':
        return 'default'
      case 'church_admin':
        return 'secondary'
      case 'teacher':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants = {
      present: { variant: 'default' as const, className: 'bg-green-500' },
      absent: { variant: 'destructive' as const, className: '' },
      excused: { variant: 'secondary' as const, className: 'bg-yellow-500' },
      late: { variant: 'secondary' as const, className: 'bg-orange-500' },
    }
    return variants[status] || { variant: 'secondary' as const, className: '' }
  }

  async function handleUpdateUser() {
    setIsSubmitting(true)
    try {
      await updateUserRoleAction(
        user.id,
        editFormData.role,
        editFormData.diocese_id || null,
        editFormData.church_id || null,
        editFormData.full_name,
        editFormData.username
      )
      toast.success(t('users.userUpdated'))
      setIsEditDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(t('users.updateFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive() {
    setIsSubmitting(true)
    try {
      if (user.is_active) {
        await deactivateUserAction(user.id)
        toast.success(t('users.userDeactivated'))
      } else {
        await activateUserAction(user.id)
        toast.success(t('users.userActivated'))
      }
      router.refresh()
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error(t('users.updateFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenEditDialog() {
    setEditFormData({
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email,
      role: user.role,
      diocese_id: user.diocese_id || '',
      church_id: user.church_id || '',
    })
    setIsEditDialogOpen(true)
  }

  function handleOpenPasswordDialog() {
    setPasswordFormData({
      adminPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setShowAdminPassword(false)
    setShowNewPassword(false)
    setIdentityVerified(false)
    setIsPasswordDialogOpen(true)
  }

  async function handleChangePassword() {
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      toast.error(t('users.passwordMismatch'))
      return
    }

    if (passwordFormData.newPassword.length < 6) {
      toast.error(t('users.passwordTooShort'))
      return
    }

    setIsSubmitting(true)
    try {
      const result = await changeUserPasswordAction(
        user.id,
        passwordFormData.newPassword,
        passwordFormData.adminPassword
      )

      if (result.success) {
        toast.success(t('users.passwordChanged'))
        setIsPasswordDialogOpen(false)
      } else {
        toast.error(result.error || t('users.passwordChangeFailed'))
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(t('users.passwordChangeFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const canChangePassword = ['super_admin', 'diocese_admin', 'church_admin', 'teacher'].includes(currentUserRole)

  const attendanceStats = attendanceRecords.length > 0 ? {
    total: attendanceRecords.length,
    present: attendanceRecords.filter((r) => r.status === 'present').length,
    absent: attendanceRecords.filter((r) => r.status === 'absent').length,
    excused: attendanceRecords.filter((r) => r.status === 'excused').length,
    late: attendanceRecords.filter((r) => r.status === 'late').length,
  } : null

  const attendanceRate = attendanceStats
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
    : 0

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="rtl:rotate-180" />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/admin/users">{t('users.title')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="rtl:rotate-180" />
          <BreadcrumbItem>
            <BreadcrumbPage>{user.full_name || user.username || user.email}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {user.full_name || user.username || user.email}
            <Badge variant={user.is_active ? 'default' : 'secondary'}>
              {user.is_active ? t('common.active') : t('common.inactive')}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('users.userDetails')} - {t(`roles.${user.role}`)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleToggleActive}
            disabled={isSubmitting}
          >
            {user.is_active ? (
              <>
                <UserX className="me-2 h-4 w-4" />
                {t('users.deactivateUser')}
              </>
            ) : (
              <>
                <UserCheck className="me-2 h-4 w-4" />
                {t('users.activateUser')}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleOpenEditDialog}>
            <Pencil className="me-2 h-4 w-4" />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="me-2 h-4 w-4" />
            {t('userDetails.overview')}
          </TabsTrigger>
          <TabsTrigger value="classes">
            <BookOpen className="me-2 h-4 w-4" />
            {t('userDetails.classes')}
          </TabsTrigger>
          {user.role === 'student' && (
            <TabsTrigger value="attendance">
              <CheckCircle className="me-2 h-4 w-4" />
              {t('userDetails.attendance')}
            </TabsTrigger>
          )}
          <TabsTrigger value="relationships">
            <Users className="me-2 h-4 w-4" />
            {t('userDetails.relationships')}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="me-2 h-4 w-4" />
            {t('userDetails.activity')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('userDetails.personalInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('common.name')}
                  </div>
                  <div className="font-medium">
                    {user.full_name || user.username || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('common.email')}
                  </div>
                  <div className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {user.email}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('users.role')}
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {t(`roles.${user.role}`)}
                  </Badge>
                </div>
                {user.diocese && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('users.diocese')}
                    </div>
                    <div className="font-medium">{user.diocese.name}</div>
                  </div>
                )}
                {user.church && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('users.church')}
                    </div>
                    <div className="font-medium">{user.church.name}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('userDetails.accountInfo')}
                </CardTitle>
                {canChangePassword && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenPasswordDialog}
                  >
                    <Key className="me-2 h-4 w-4" />
                    {t('users.changePassword')}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {user.user_code && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('users.userCode')}
                    </div>
                    <div className="font-mono text-lg font-bold">{user.user_code}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('userDetails.userId')}
                  </div>
                  <div className="font-mono text-xs break-all">{user.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('common.status')}
                  </div>
                  <Badge variant={user.is_active ? 'default' : 'secondary'}>
                    {user.is_active ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {t('userDetails.accountCreated')}
                  </div>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                {loginHistory.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {t('userDetails.lastLogin')}
                    </div>
                    <div className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {new Date(loginHistory[0].login_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats for Students */}
          {user.role === 'student' && attendanceStats && (
            <Card>
              <CardHeader>
                <CardTitle>{t('userDetails.attendanceStats')}</CardTitle>
                <CardDescription>
                  {t('userDetails.last30Days')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {t('attendance.total')}
                    </div>
                    <div className="text-2xl font-bold">
                      {attendanceStats.total}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {t('attendance.present')}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {attendanceStats.present}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {t('attendance.absent')}
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {attendanceStats.absent}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {t('attendance.excused')}
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {attendanceStats.excused}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {t('userDetails.attendanceRate')}
                    </div>
                    <div className="text-2xl font-bold">{attendanceRate}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>{t('userDetails.classAssignments')}</CardTitle>
              <CardDescription>
                {classAssignments.length}{' '}
                {classAssignments.length === 1
                  ? t('userDetails.classAssigned')
                  : t('userDetails.classesAssigned')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('userDetails.noClassAssignments')}
                </div>
              ) : (
                <div className="space-y-3">
                  {classAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border rounded-lg p-4 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-semibold">
                            {assignment.class?.name || '-'}
                          </div>
                          {assignment.class?.church && (
                            <div className="text-sm text-muted-foreground">
                              {assignment.class.church.name}
                            </div>
                          )}
                          {assignment.class?.grade_level && (
                            <div className="text-sm text-muted-foreground">
                              {assignment.class.grade_level}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">
                          {t(`userDetails.${assignment.assignment_type}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab (for students) */}
        {user.role === 'student' && (
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>{t('userDetails.attendanceHistory')}</CardTitle>
                <CardDescription>
                  {t('userDetails.last30Days')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('userDetails.noAttendanceRecords')}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('classes.class')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                        <TableHead>{t('userDetails.notes')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((record) => {
                        const statusBadge = getStatusBadge(record.status)
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              {new Date(
                                record.attendance_date
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{record.class?.name || '-'}</TableCell>
                            <TableCell>
                              <Badge
                                variant={statusBadge.variant}
                                className={statusBadge.className}
                              >
                                {t(`attendance.${record.status}`)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {record.notes || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <Card>
            <CardHeader>
              <CardTitle>{t('userDetails.relationships')}</CardTitle>
              <CardDescription>
                {t('userDetails.familyConnections')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relationships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('userDetails.noRelationships')}
                </div>
              ) : (
                <div className="space-y-3">
                  {relationships.map((rel) => {
                    const isParent = rel.parent?.id === user.id
                    const relatedUser = isParent ? rel.student : rel.parent
                    return (
                      <div
                        key={rel.id}
                        className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                        onClick={() =>
                          relatedUser && router.push(`/admin/users/${relatedUser.id}`)
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {relatedUser?.full_name || relatedUser?.email || '-'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {relatedUser?.email}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {isParent
                              ? t('userDetails.child')
                              : t('userDetails.parent')}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>{t('userDetails.loginHistory')}</CardTitle>
              <CardDescription>
                {t('userDetails.recentLogins')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loginHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('userDetails.noLoginHistory')}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('userDetails.loginTime')}</TableHead>
                      <TableHead>{t('userDetails.ipAddress')}</TableHead>
                      <TableHead>{t('userDetails.device')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginHistory.map((login) => (
                      <TableRow key={login.id}>
                        <TableCell>
                          {new Date(login.login_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {login.ip_address || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                          {login.user_agent || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('users.editUser')}</DialogTitle>
            <DialogDescription>
              {t('users.subtitle')}: {user.full_name || user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t('users.fullName')}</Label>
              <Input
                value={editFormData.full_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, full_name: e.target.value })
                }
                placeholder="John Doe"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={editFormData.username}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, username: e.target.value })
                }
                placeholder="john_doe"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('users.role')} *</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, role: value as UserRole })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">
                    {t('roles.super_admin')}
                  </SelectItem>
                  <SelectItem value="diocese_admin">
                    {t('roles.diocese_admin')}
                  </SelectItem>
                  <SelectItem value="church_admin">
                    {t('roles.church_admin')}
                  </SelectItem>
                  <SelectItem value="teacher">{t('roles.teacher')}</SelectItem>
                  <SelectItem value="parent">{t('roles.parent')}</SelectItem>
                  <SelectItem value="student">{t('roles.student')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editFormData.role === 'diocese_admin' && (
              <div className="space-y-2">
                <Label>{t('users.diocese')}</Label>
                <Select
                  value={editFormData.diocese_id}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, diocese_id: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('users.selectDiocese')} />
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

            {['church_admin', 'teacher', 'parent', 'student'].includes(
              editFormData.role
            ) && (
              <div className="space-y-2">
                <Label>{t('users.church')}</Label>
                <Select
                  value={editFormData.church_id}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, church_id: value })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('users.selectChurch')} />
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
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? t('common.saving') : t('common.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('users.changePassword')}
            </DialogTitle>
            <DialogDescription>
              {t('users.changePasswordFor')}: {user.full_name || user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Security Warning */}
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('users.passwordSecurityWarning')}
              </p>
            </div>

            {/* Admin Password Verification */}
            <div className="space-y-2">
              <Label>{t('users.yourPassword')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('users.confirmIdentity')}
              </p>
              <div className="relative">
                <Input
                  type={showAdminPassword ? 'text' : 'password'}
                  value={passwordFormData.adminPassword}
                  onChange={(e) =>
                    setPasswordFormData({
                      ...passwordFormData,
                      adminPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                >
                  {showAdminPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <hr className="my-4" />

            {/* New Password */}
            <div className="space-y-2">
              <Label>{t('users.newPassword')}</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordFormData.newPassword}
                  onChange={(e) =>
                    setPasswordFormData({
                      ...passwordFormData,
                      newPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('users.passwordMinLength')}
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label>{t('users.confirmNewPassword')}</Label>
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordFormData.confirmPassword}
                onChange={(e) =>
                  setPasswordFormData({
                    ...passwordFormData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {passwordFormData.confirmPassword &&
                passwordFormData.newPassword !== passwordFormData.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {t('users.passwordMismatch')}
                  </p>
                )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={
                isSubmitting ||
                !passwordFormData.adminPassword ||
                !passwordFormData.newPassword ||
                !passwordFormData.confirmPassword ||
                passwordFormData.newPassword !== passwordFormData.confirmPassword
              }
            >
              {isSubmitting ? t('common.saving') : t('users.changePassword')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
