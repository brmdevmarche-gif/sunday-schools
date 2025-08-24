"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Calendar, Trophy, Activity, BarChart3 } from "lucide-react"
import { PageHeader } from "@/components/page-header"

// Mock data for reports
const attendanceData = [
  { id: 1, name: "John Smith", class: "Grade 10", totalDays: 30, presentDays: 28, attendanceRate: 93.3 },
  { id: 2, name: "Sarah Johnson", class: "Grade 11", totalDays: 30, presentDays: 30, attendanceRate: 100 },
  { id: 3, name: "Michael Brown", class: "Grade 9", totalDays: 30, presentDays: 25, attendanceRate: 83.3 },
  { id: 4, name: "Emily Davis", class: "Grade 12", totalDays: 30, presentDays: 29, attendanceRate: 96.7 },
  { id: 5, name: "David Wilson", class: "Grade 10", totalDays: 30, presentDays: 27, attendanceRate: 90.0 },
  { id: 6, name: "Lisa Anderson", class: "Grade 11", totalDays: 30, presentDays: 26, attendanceRate: 86.7 },
]

const pointsLeaderboard = [
  { id: 1, name: "Sarah Johnson", class: "Grade 11", points: 950, rank: 1 },
  { id: 2, name: "Emily Davis", class: "Grade 12", points: 920, rank: 2 },
  { id: 3, name: "John Smith", class: "Grade 10", points: 885, rank: 3 },
  { id: 4, name: "David Wilson", class: "Grade 10", points: 860, rank: 4 },
  { id: 5, name: "Lisa Anderson", class: "Grade 11", points: 840, rank: 5 },
  { id: 6, name: "Michael Brown", class: "Grade 9", points: 780, rank: 6 },
]

const activitiesData = [
  { type: "Bible Reading", count: 145, color: "#3b82f6" },
  { type: "Mass Attendance", count: 89, color: "#10b981" },
  { type: "Fasting", count: 67, color: "#f59e0b" },
  { type: "Other Activities", count: 123, color: "#8b5cf6" },
]

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]

export default function ReportsPage() {
  const [selectedClass, setSelectedClass] = useState("all")
  const [dateRange, setDateRange] = useState("last-30-days")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAttendanceData = attendanceData.filter((student) => {
    const matchesClass = selectedClass === "all" || student.class === selectedClass
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesClass && matchesSearch
  })

  const getAttendanceBadgeColor = (rate: number) => {
    if (rate >= 95) return "bg-green-100 text-green-800"
    if (rate >= 85) return "bg-blue-100 text-blue-800"
    if (rate >= 75) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800"
    if (rank === 2) return "bg-gray-100 text-gray-800"
    if (rank === 3) return "bg-orange-100 text-orange-800"
    return "bg-blue-100 text-blue-800"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Reports"
          icon={<BarChart3 className="h-6 w-6" />}
          actionButton={{
            label: "Export Data",
            onClick: () => console.log("Export data clicked"),
            variant: "outline",
          }}
        />

        {/* Reports Tabs */}
        <Card className="shadow-lg">
          <Tabs defaultValue="attendance" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="attendance" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger value="points" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Points
                </TabsTrigger>
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activities
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                      <SelectItem value="Grade 11">Grade 11</SelectItem>
                      <SelectItem value="Grade 12">Grade 12</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-7-days">Last 7 days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 days</SelectItem>
                      <SelectItem value="last-90-days">Last 90 days</SelectItem>
                      <SelectItem value="this-year">This year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Student</TableHead>
                        <TableHead className="font-semibold">Class</TableHead>
                        <TableHead className="font-semibold">Present Days</TableHead>
                        <TableHead className="font-semibold">Total Days</TableHead>
                        <TableHead className="font-semibold">Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendanceData.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>{student.presentDays}</TableCell>
                          <TableCell>{student.totalDays}</TableCell>
                          <TableCell>
                            <Badge className={getAttendanceBadgeColor(student.attendanceRate)}>
                              {student.attendanceRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Points Tab */}
              <TabsContent value="points" className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold">Points Leaderboard</h3>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Rank</TableHead>
                        <TableHead className="font-semibold">Student</TableHead>
                        <TableHead className="font-semibold">Class</TableHead>
                        <TableHead className="font-semibold">Total Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pointsLeaderboard.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Badge className={getRankBadgeColor(student.rank)}>#{student.rank}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">{student.points} pts</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities" className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Activity Summary</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Activity Count</CardTitle>
                      <CardDescription>Number of activities by type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          count: {
                            label: "Count",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={activitiesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="count" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Activity Distribution</CardTitle>
                      <CardDescription>Percentage breakdown by activity type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          count: {
                            label: "Count",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={activitiesData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="count"
                            >
                              {activitiesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Activity Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {activitiesData.map((activity, index) => (
                    <Card key={activity.type}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{activity.type}</p>
                            <p className="text-2xl font-bold" style={{ color: activity.color }}>
                              {activity.count}
                            </p>
                          </div>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activity.color }} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
