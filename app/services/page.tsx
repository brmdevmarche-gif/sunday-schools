"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Settings, Search, Users, BookOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface ServiceClass {
  id: string
  name: string
  teacher: string
  studentCount: number
  serviceType: string
}

const serviceTypes = [
  { name: "Angels", icon: "👼", description: "Early childhood ministry", href: "/services/angels" },
  { name: "Primary", icon: "🌱", description: "Elementary age students", href: "/services/primary" },
  { name: "Secondary", icon: "📚", description: "Middle school students", href: "/services/secondary" },
  { name: "High", icon: "🎓", description: "High school students", href: "/services/high" },
  { name: "University", icon: "🏛️", description: "College age ministry", href: "/services/university" },
  { name: "Graduates", icon: "👨‍💼", description: "Post-graduate ministry", href: "/services/graduates" },
]

const mockClasses = [
  { id: "1", name: "Class A", teacher: "Teacher X", studentCount: 20, serviceType: "Angels" },
  { id: "2", name: "Class B", teacher: "Teacher Y", studentCount: 15, serviceType: "Primary" },
  // ... other mock classes here ...
]

export default function ServicesOverviewPage() {
  const [classes, setClasses] = useState<ServiceClass[]>(mockClasses)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.serviceType.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getServiceStats = () => {
    const stats = serviceTypes.map((service) => ({
      ...service,
      classCount: classes.filter((cls) => cls.serviceType === service.name.toLowerCase()).length,
      studentCount: classes
        .filter((cls) => cls.serviceType === service.name.toLowerCase())
        .reduce((sum, cls) => sum + cls.studentCount, 0),
    }))
    return stats
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services Overview"
        description="Manage classes and students across all service types"
        icon={<Settings className="h-6 w-6" />}
      />

      {/* Service Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getServiceStats().map((service) => (
          <Link key={service.name} href={service.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <span className="text-2xl">{service.icon}</span>
                  {service.name}
                </CardTitle>
                <p className="text-sm text-gray-600">{service.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{service.classCount}</div>
                      <div className="text-xs text-gray-500">Classes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{service.studentCount}</div>
                      <div className="text-xs text-gray-500">Students</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* All Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Service Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search classes, teachers, or service types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {cls.serviceType}
                      </span>
                    </TableCell>
                    <TableCell>{cls.teacher}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        {cls.studentCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/services/${cls.serviceType}/classes/${cls.id}`}>View Details</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClasses.length === 0 && (
            <div className="text-center py-8 text-gray-500">No classes found matching your search.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
