"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"

// Mock data for purchase history
const mockPurchases = [
  {
    id: 1,
    student: "Sarah Johnson",
    item: "Church T-Shirt",
    pointsSpent: 150,
    date: "2024-01-15",
    studentId: 1,
  },
  {
    id: 2,
    student: "Michael Chen",
    item: "Bible Study Guide",
    pointsSpent: 75,
    date: "2024-01-14",
    studentId: 2,
  },
  {
    id: 3,
    student: "Emily Rodriguez",
    item: "Youth Camp Hoodie",
    pointsSpent: 200,
    date: "2024-01-13",
    studentId: 3,
  },
  {
    id: 4,
    student: "David Kim",
    item: "Prayer Journal",
    pointsSpent: 50,
    date: "2024-01-12",
    studentId: 4,
  },
  {
    id: 5,
    student: "Sarah Johnson",
    item: "Scripture Cards Set",
    pointsSpent: 25,
    date: "2024-01-11",
    studentId: 1,
  },
  {
    id: 6,
    student: "Jessica Martinez",
    item: "Worship Music CD",
    pointsSpent: 100,
    date: "2024-01-10",
    studentId: 5,
  },
]

// Mock students for filter dropdown
const mockStudents = [
  { id: 1, name: "Sarah Johnson" },
  { id: 2, name: "Michael Chen" },
  { id: 3, name: "Emily Rodriguez" },
  { id: 4, name: "David Kim" },
  { id: 5, name: "Jessica Martinez" },
]

export default function PurchasesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<string>("all")

  // Filter purchases based on search term and selected student
  const filteredPurchases = mockPurchases.filter((purchase) => {
    const matchesSearch =
      purchase.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.item.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStudent = selectedStudent === "all" || purchase.studentId.toString() === selectedStudent
    return matchesSearch && matchesStudent
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getPointsBadgeColor = (points: number) => {
    if (points >= 150) return "bg-red-100 text-red-800"
    if (points >= 100) return "bg-orange-100 text-orange-800"
    if (points >= 50) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Purchases"
        description="Track and manage all student store purchases"
        action={
          <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by student or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {mockStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Purchase History Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Points Spent</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No purchases found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.student}</TableCell>
                      <TableCell>{purchase.item}</TableCell>
                      <TableCell>
                        <Badge className={getPointsBadgeColor(purchase.pointsSpent)}>{purchase.pointsSpent} pts</Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">{formatDate(purchase.date)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {filteredPurchases.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Total Purchases: {filteredPurchases.length}</span>
                <span>
                  Total Points Spent: {filteredPurchases.reduce((sum, purchase) => sum + purchase.pointsSpent, 0)} pts
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
