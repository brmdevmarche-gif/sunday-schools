"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Trophy, ShoppingBag, MapPin, User } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"

// Mock data - in a real app, this would come from your database
const studentData = {
  id: "1",
  name: "Sarah Johnson",
  class: "10th Grade",
  points: 850,
  botlStatus: "Active",
  createdAt: "2023-09-01",
  activities: [
    { id: 1, activity: "Bible Study Participation", date: "2024-01-15", points: 50 },
    { id: 2, activity: "Community Service", date: "2024-01-10", points: 100 },
    { id: 3, activity: "Scripture Memorization", date: "2024-01-08", points: 75 },
    { id: 4, activity: "Youth Group Leadership", date: "2024-01-05", points: 125 },
  ],
  attendance: [
    { id: 1, date: "2024-01-21", status: "Present" },
    { id: 2, date: "2024-01-14", status: "Present" },
    { id: 3, date: "2024-01-07", status: "Absent" },
    { id: 4, date: "2023-12-31", status: "Present" },
    { id: 5, date: "2023-12-24", status: "Present" },
  ],
  storePurchases: [
    { id: 1, item: "Study Bible", date: "2024-01-12", points: 200 },
    { id: 2, item: "Christian T-Shirt", date: "2024-01-05", points: 75 },
    { id: 3, item: "Devotional Book", date: "2023-12-20", points: 100 },
  ],
  trips: [
    { id: 1, trip: "Youth Retreat 2024", date: "2024-02-15", status: "Registered" },
    { id: 2, trip: "Mission Trip - Honduras", date: "2024-07-10", status: "Pending" },
    { id: 3, trip: "Summer Camp", date: "2023-08-15", status: "Completed" },
  ],
}

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("overview")

  const getPointsColor = (points: number) => {
    if (points >= 800) return "text-green-600"
    if (points >= 600) return "text-blue-600"
    if (points >= 400) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusBadge = (status: string) => {
    const variant =
      status === "Present"
        ? "default"
        : status === "Active"
          ? "default"
          : status === "Completed"
            ? "secondary"
            : status === "Registered"
              ? "default"
              : "destructive"
    return <Badge variant={variant}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
        </div>

        <PageHeader
          title={`${studentData.name} - ${studentData.class}`}
          description="Student profile and activity tracking"
          icon={<User className="h-6 w-6" />}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Store Purchases
            </TabsTrigger>
            <TabsTrigger value="trips" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Trips
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Points Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getPointsColor(studentData.points)}`}>{studentData.points}</div>
                  <p className="text-sm text-gray-500 mt-1">Total points earned</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">BOTL Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">{getStatusBadge(studentData.botlStatus)}</div>
                  <p className="text-sm text-gray-500 mt-1">Book of the Law participation</p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Member Since</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(studentData.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Registration date</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Activities & Points Earned</CardTitle>
                <CardDescription>Recent activities and points awarded</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Activity</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="text-right font-semibold">Points Earned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentData.activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.activity}</TableCell>
                        <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-600">+{activity.points}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Attendance Record</CardTitle>
                <CardDescription>Weekly attendance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentData.attendance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Purchases Tab */}
          <TabsContent value="store">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Store Purchases</CardTitle>
                <CardDescription>Items purchased with earned points</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Item</TableHead>
                      <TableHead className="font-semibold">Purchase Date</TableHead>
                      <TableHead className="text-right font-semibold">Points Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentData.storePurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.item}</TableCell>
                        <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-red-600">-{purchase.points}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trips Tab */}
          <TabsContent value="trips">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Trips & Events</CardTitle>
                <CardDescription>Registered and completed trips</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Trip/Event</TableHead>
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentData.trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">{trip.trip}</TableCell>
                        <TableCell>{new Date(trip.date).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
