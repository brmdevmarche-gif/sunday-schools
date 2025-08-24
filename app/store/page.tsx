"use client"

import { useState } from "react"
import { Search, Edit, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

const mockStoreItems = [
  {
    id: 1,
    name: "knesty T-Shirt",
    description: "Official t-shirt with logo",
    pointsCost: 150,
    available: true,
  },
  {
    id: 2,
    name: "Water Bottle",
    description: "Insulated water bottle with knesty branding",
    pointsCost: 100,
    available: true,
  },
  {
    id: 3,
    name: "Study Bible",
    description: "NIV Study Bible with commentary",
    pointsCost: 300,
    available: false,
  },
  {
    id: 4,
    name: "Coffee Mug",
    description: "Ceramic mug with inspirational verse",
    pointsCost: 75,
    available: true,
  },
  {
    id: 5,
    name: "Notebook Set",
    description: "Set of 3 journals for devotions",
    pointsCost: 120,
    available: true,
  },
  {
    id: 6,
    name: "Keychain",
    description: "Metal keychain with knesty logo",
    pointsCost: 25,
    available: false,
  },
]

export default function StorePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [items, setItems] = useState(mockStoreItems)

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleAvailability = (id: number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, available: !item.available } : item)))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Store Items"
          icon={<ShoppingBag className="h-6 w-6" />}
          actionButton={{
            label: "Add Item",
            onClick: () => console.log("Add item clicked"),
          }}
        />

        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Points Cost</TableHead>
                    <TableHead className="font-semibold">Available</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-gray-600">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {item.pointsCost} pts
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch checked={item.available} onCheckedChange={() => toggleAvailability(item.id)} />
                          <span className={`text-sm ${item.available ? "text-green-600" : "text-red-600"}`}>
                            {item.available ? "Available" : "Unavailable"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">No items found matching your search.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
