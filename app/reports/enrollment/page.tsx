"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, Users, GraduationCap, Calendar, TrendingUp } from "lucide-react"

// Mock data for demonstration
const mockParishes = [
  { id: "1", name: "St. Mary Parish" },
  { id: "2", name: "Sacred Heart Parish" },
  { id: "3", name: "St. Joseph Parish" },
]

const mockChurches = [
  { id: "1", name: "St. Mary Cathedral", parishId: "1" },
  { id: "2", name: "Sacred Heart Church", parishId: "2" },
  { id: "3", name: "St. Joseph Chapel", parishId: "3" },
]

const mockPeriods = [
  { id: "1", name: "Fall 2024", churchId: "1" },
  { id: "2", name: "Spring 2024", churchId: "1" },
  { id: "3", name: "Summer 2024", churchId: "2" },
]

const mockEnrollmentData = [
  {
    className: "Youth Ministry",
    students: [
      { id: "1", name: "John Smith", enrolledAt: "2024-01-15", leftAt: null },
      { id: "2", name: "Sarah Johnson", enrolledAt: "2024-01-20", leftAt: "2024-06-15" },
      { id: "3", name: "Michael Brown", enrolledAt: "2024-02-01", leftAt: null },
    ],
  },
  {
    className: "Adult Bible Study",
    students: [
      { id: "4", name: "Mary Wilson", enrolledAt: "2024-01-10", leftAt: null },
      { id: "5", name: "David Davis", enrolledAt: "2024-01-25", leftAt: null },
      { id: "6", name: "Lisa Garcia", enrolledAt: "2024-02-05", leftAt: "2024-05-20" },
    ],
  },
  {
    className: "Children's Sunday School",
    students: [
      { id: "7", name: "Emma Martinez", enrolledAt: "2024-01-12", leftAt: null },
      { id: "8", name: "James Anderson", enrolledAt: "2024-01-18", leftAt: null },
      { id: "9", name: "Olivia Taylor", enrolledAt: "2024-02-03", leftAt: null },
      { id: "10", name: "William Thomas", enrolledAt: "2024-01-30", leftAt: "2024-04-10" },
    ],
  },
]

export default function EnrollmentReportPage() {
  const [selectedParish, setSelectedParish] = useState<string>("all")
  const [selectedChurch, setSelectedChurch] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Filter data based on selections
  const filteredData = mockEnrollmentData.filter(
    (classData) =>
      classData.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classData.students.some((student) => student.name.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Calculate summary statistics
  const totalStudents = filteredData.reduce((sum, classData) => sum + classData.students.length, 0)
  const activeStudents = filteredData.reduce(
    (sum, classData) => sum + classData.students.filter((student) => !student.leftAt).length,
    0,
  )
  const totalClasses = filteredData.length
  const averagePerClass = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0

  const handleExport = (format: "csv" | "excel") => {
    // Mock export functionality
    console.log(`Exporting enrollment report as ${format.toUpperCase()}`)
    // In a real app, this would generate and download the file
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollment Report"
        description="View and analyze student enrollment across parishes, churches, and periods"
        icon={Users}
        action={
          <div className="flex gap-2">
            <Button onClick={() => handleExport("csv")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => handleExport("excel")} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter enrollment data by location and time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parish">Parish</Label>
              <Select value={selectedParish} onValueChange={setSelectedParish}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parish" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parishes</SelectItem>
                  {mockParishes.map((parish) => (
                    <SelectItem key={parish.id} value={parish.id}>
                      {parish.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="church">Church</Label>
              <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select church" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Churches</SelectItem>
                  {mockChurches
                    .filter((church) => selectedParish === "all" || church.parishId === selectedParish)
                    .map((church) => (
                      <SelectItem key={church.id} value={church.id}>
                        {church.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {mockPeriods
                    .filter((period) => selectedChurch === "all" || period.churchId === selectedChurch)
                    .map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search students or classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all selected filters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudents}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">With enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Class</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePerClass}</div>
            <p className="text-xs text-muted-foreground">Students per class</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrollment Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Details</CardTitle>
          <CardDescription>Students grouped by class with enrollment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredData.map((classData, classIndex) => (
              <div key={classIndex} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-600">{classData.className}</h3>
                  <Badge variant="secondary">
                    {classData.students.length} student{classData.students.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Enrolled At</TableHead>
                        <TableHead>Left At</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classData.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{classData.className}</TableCell>
                          <TableCell>{new Date(student.enrolledAt).toLocaleDateString()}</TableCell>
                          <TableCell>{student.leftAt ? new Date(student.leftAt).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={student.leftAt ? "secondary" : "default"}>
                              {student.leftAt ? "Left" : "Active"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No enrollment data found for the selected filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
