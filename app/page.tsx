import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Edit, UserX, Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"

const students = [
  { id: 1, name: "Sarah Johnson", class: "Youth Group", points: 85, botl: "Yes", status: "Active" },
  { id: 2, name: "Michael Chen", class: "Adult Bible Study", points: 92, botl: "No", status: "Active" },
  { id: 3, name: "Emma Rodriguez", class: "Children's Ministry", points: 78, botl: "Yes", status: "Active" },
  { id: 4, name: "David Thompson", class: "Youth Group", points: 67, botl: "No", status: "Inactive" },
  { id: 5, name: "Lisa Park", class: "Women's Fellowship", points: 94, botl: "Yes", status: "Active" },
]

export default function StudentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Students"
          description="Manage student records and track their progress"
          icon={<Users className="h-6 w-6" />}
          actionButton={{
            label: "Add Student",
            onClick: () => console.log("Add student clicked"),
          }}
        />

        <Card className="shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search students..." className="pl-10" />
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Class</TableHead>
                    <TableHead className="font-semibold">Points</TableHead>
                    <TableHead className="font-semibold">BOTL</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.class}</TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            student.points >= 90
                              ? "text-green-600"
                              : student.points >= 80
                                ? "text-blue-600"
                                : student.points >= 70
                                  ? "text-yellow-600"
                                  : "text-red-600"
                          }`}
                        >
                          {student.points}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.botl === "Yes" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {student.botl}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {student.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="h-8 px-2 bg-transparent">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Disable
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
