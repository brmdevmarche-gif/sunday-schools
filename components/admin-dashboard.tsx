"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Church, Calendar, UserCheck, BookOpen, BarChart3, Settings, ChevronRight } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { ChurchManagement } from "@/components/church-management"
import { StudentManagement } from "@/components/student-management"
import { ServantManagement } from "@/components/servant-management"
import { ActivityManagement } from "@/components/activity-management"
import { createClient } from "@/lib/supabase"

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeChurches: 0,
    servants: 0,
    upcomingActivities: 0,
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch stats
      const [studentsResult, churchesResult, servantsResult, activitiesResult] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("churches").select("id", { count: "exact", head: true }),
        supabase.from("servants").select("id").eq("is_active", true),
        supabase.from("church_activities").select("*").gte("activity_date", new Date().toISOString()).limit(5),
      ])

      setStats({
        totalStudents: studentsResult.count || 0,
        activeChurches: churchesResult.count || 0,
        servants: servantsResult.data?.length || 0,
        upcomingActivities: activitiesResult.data?.length || 0,
      })

      // Fetch recent activities with church names
      const { data: activities } = await supabase
        .from("church_activities")
        .select(`
          *,
          churches (name)
        `)
        .order("created_at", { ascending: false })
        .limit(3)

      setRecentActivities(activities || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: "Total Students",
      value: loading ? "..." : stats.totalStudents.toString(),
      change: "+12 this month",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Churches",
      value: loading ? "..." : stats.activeChurches.toString(),
      change: "+2 this year",
      icon: Church,
      color: "text-green-600",
    },
    {
      title: "Servants",
      value: loading ? "..." : stats.servants.toString(),
      change: "+5 this month",
      icon: UserCheck,
      color: "text-purple-600",
    },
    {
      title: "Upcoming Activities",
      value: loading ? "..." : stats.upcomingActivities.toString(),
      change: "This week",
      icon: Calendar,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Sunday School Dashboard</h1>
                  <p className="text-muted-foreground mt-1">
                    Welcome back! Here's what's happening in your Sunday Schools.
                  </p>
                </div>
                <Button className="bg-accent hover:bg-accent/90">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                  <Card key={index} className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activities and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activities */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Recent Activities</CardTitle>
                    <CardDescription>Latest church activities and events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? (
                      <div className="text-center py-4">Loading activities...</div>
                    ) : recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{activity.activity_name}</h4>
                            <p className="text-sm text-muted-foreground">{activity.churches?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.activity_date
                                ? new Date(activity.activity_date).toLocaleDateString()
                                : "No date"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={new Date(activity.activity_date) > new Date() ? "default" : "secondary"}>
                              {new Date(activity.activity_date) > new Date() ? "upcoming" : "completed"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{activity.max_participants || 0} max</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">No activities found</div>
                    )}
                    <Button variant="outline" className="w-full bg-transparent">
                      View All Activities
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveSection("students")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Add New Student
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveSection("servants")}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Register Servant
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveSection("activities")}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Create Activity
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveSection("churches")}
                    >
                      <Church className="w-4 h-4 mr-2" />
                      Manage Churches
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Plan Lessons
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Reports
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === "churches" && <ChurchManagement />}

          {activeSection === "students" && <StudentManagement />}

          {activeSection === "servants" && <ServantManagement />}

          {activeSection === "activities" && <ActivityManagement />}

          {/* Placeholder content for other sections */}
          {!["dashboard", "churches", "students", "servants", "activities"].includes(activeSection) && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Management
                </h2>
                <p className="text-muted-foreground">This section will be implemented in the next steps.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
