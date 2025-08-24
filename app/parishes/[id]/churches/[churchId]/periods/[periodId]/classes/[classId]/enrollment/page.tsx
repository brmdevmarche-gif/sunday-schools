"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Search, UserPlus, ArrowRight, UserMinus, Users, CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Student {
  id: string
  name: string
  class: string
  points: number
  status: "active" | "inactive"
}

interface Enrollment {
  id: string
  studentId: string
  studentName: string
  enrolledAt: string
  leftAt?: string
  status: "active" | "ended"
}

// Mock data
const mockAvailableStudents: Student[] = [
  { id: "1", name: "John Smith", class: "Grade 5", points: 850, status: "active" },
  { id: "2", name: "Sarah Johnson", class: "Grade 4", points: 920, status: "active" },
  { id: "3", name: "Michael Brown", class: "Grade 6", points: 780, status: "active" },
  { id: "4", name: "Emily Davis", class: "Grade 5", points: 1050, status: "active" },
  { id: "5", name: "David Wilson", class: "Grade 4", points: 690, status: "active" },
]

const mockCurrentEnrollments: Enrollment[] = [
  { id: "1", studentId: "6", studentName: "Anna Martinez", enrolledAt: "2024-01-15", status: "active" },
  { id: "2", studentId: "7", studentName: "James Taylor", enrolledAt: "2024-01-15", status: "active" },
  {
    id: "3",
    studentId: "8",
    studentName: "Lisa Anderson",
    enrolledAt: "2024-01-10",
    leftAt: "2024-02-20",
    status: "ended",
  },
  { id: "4", studentId: "9", studentName: "Robert Garcia", enrolledAt: "2024-01-20", status: "active" },
]

const mockAvailableClasses = [
  { id: "class1", name: "Adult Bible Study", teacher: "Pastor John" },
  { id: "class2", name: "Teen Fellowship", teacher: "Sarah Wilson" },
  { id: "class3", name: "Children's Ministry", teacher: "Mary Johnson" },
  { id: "class4", name: "Young Adults", teacher: "David Brown" },
]

export default function StudentEnrollmentPage({
  params,
}: {
  params: { id: string; churchId: string; periodId: string; classId: string }
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false)
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [moveDate, setMoveDate] = useState<Date>()
  const { toast } = useToast()

  // Mock data for breadcrumbs
  const parishName = "St. Mary's Parish"
  const churchName = "Sacred Heart Church"
  const periodName = "Spring 2024"
  const className = "Youth Bible Study"

  const filteredStudents = mockAvailableStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const activeEnrollments = mockCurrentEnrollments.filter((e) => e.status === "active")
  const totalEnrollments = mockCurrentEnrollments.length

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId])
    } else {
      setSelectedStudents(selectedStudents.filter((id) => id !== studentId))
    }
  }

  const handleEnrollSelected = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student to enroll.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Students enrolled successfully",
      description: `${selectedStudents.length} student(s) have been enrolled in ${className}.`,
    })
    setSelectedStudents([])
    setIsEnrollDialogOpen(false)
  }

  const handleMoveStudent = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment)
    setSelectedClasses([])
    setMoveDate(undefined)
    setIsMoveDialogOpen(true)
  }

  const handleEndEnrollment = (enrollment: Enrollment) => {
    toast({
      title: "Enrollment ended",
      description: `${enrollment.studentName} has been removed from ${className}.`,
    })
  }

  const handleClassSelect = (classId: string, checked: boolean) => {
    if (checked) {
      setSelectedClasses([...selectedClasses, classId])
    } else {
      setSelectedClasses(selectedClasses.filter((id) => id !== classId))
    }
  }

  const confirmMoveStudent = () => {
    if (selectedEnrollment && selectedClasses.length > 0 && moveDate) {
      const selectedClassNames = mockAvailableClasses
        .filter((cls) => selectedClasses.includes(cls.id))
        .map((cls) => cls.name)
        .join(", ")

      toast({
        title: "Student moved",
        description: `${selectedEnrollment.studentName} has been moved to ${selectedClassNames} effective ${format(moveDate, "PPP")}.`,
      })
      setIsMoveDialogOpen(false)
      setSelectedEnrollment(null)
      setSelectedClasses([])
      setMoveDate(undefined)
    } else {
      toast({
        title: "Missing information",
        description: "Please select at least one class and an effective date.",
        variant: "destructive",
      })
    }
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
            <BreadcrumbLink href={`/parishes/${params.id}/churches/${params.churchId}/periods`}>
              {churchName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/parishes/${params.id}/churches/${params.churchId}/periods/${params.periodId}/classes`}
            >
              {periodName}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Enroll Students</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title={`Enroll Students in ${className}`}
        description="Manage student enrollment for this class"
        action={
          <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Enroll Students
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Enroll Students</DialogTitle>
                <DialogDescription>Search and select students to enroll in {className}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search students by name or class..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Current Class</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{student.points} pts</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={student.status === "active" ? "default" : "secondary"}>
                              {student.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {selectedStudents.length > 0 && (
                  <div className="text-sm text-muted-foreground">{selectedStudents.length} student(s) selected</div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEnrollSelected}>Enroll Selected ({selectedStudents.length})</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Students</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAvailableStudents.length}</div>
            <p className="text-xs text-muted-foreground">Can be enrolled</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Enrollments</CardTitle>
          <CardDescription>Students currently enrolled in {className}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Enrolled At</TableHead>
                <TableHead>Left At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCurrentEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">{enrollment.studentName}</TableCell>
                  <TableCell>{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                  <TableCell>{enrollment.leftAt ? new Date(enrollment.leftAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {enrollment.status === "active" && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleMoveStudent(enrollment)}>
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Move
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEndEnrollment(enrollment)}>
                            <UserMinus className="h-4 w-4 mr-1" />
                            End
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Move Student Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Move Student</DialogTitle>
            <DialogDescription>Move {selectedEnrollment?.studentName} to one or more new classes</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Student Info */}
            <div className="p-4 bg-muted rounded-lg">
              <Label className="text-sm font-medium text-muted-foreground">Current Student</Label>
              <p className="text-lg font-semibold">{selectedEnrollment?.studentName}</p>
            </div>

            {/* Class Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Target Classes</Label>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Class Name</TableHead>
                      <TableHead>Teacher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAvailableClasses.map((classItem) => (
                      <TableRow key={classItem.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedClasses.includes(classItem.id)}
                            onCheckedChange={(checked) => handleClassSelect(classItem.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{classItem.name}</TableCell>
                        <TableCell>{classItem.teacher}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {selectedClasses.length > 0 && (
                <p className="text-sm text-muted-foreground">{selectedClasses.length} class(es) selected</p>
              )}
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Effective Move Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !moveDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {moveDate ? format(moveDate, "PPP") : "Select move date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={moveDate} onSelect={setMoveDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMoveStudent}>Move Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
