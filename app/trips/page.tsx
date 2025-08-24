"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Search, Edit, Users, Calendar, DollarSign, Coins, MapPin } from "lucide-react"
import { PageHeader } from "@/components/page-header"

// Mock data for trips
const mockTrips = [
  {
    id: 1,
    title: "Summer Camp 2024",
    startDate: "2024-07-15",
    endDate: "2024-07-22",
    priceCash: 250,
    pricePoints: 5000,
    status: "upcoming",
    bookings: 24,
  },
  {
    id: 2,
    title: "Youth Retreat",
    startDate: "2024-06-10",
    endDate: "2024-06-12",
    priceCash: 150,
    pricePoints: 3000,
    status: "upcoming",
    bookings: 18,
  },
  {
    id: 3,
    title: "Spring Break Mission",
    startDate: "2024-03-18",
    endDate: "2024-03-25",
    priceCash: 400,
    pricePoints: 8000,
    status: "past",
    bookings: 32,
  },
  {
    id: 4,
    title: "Winter Ski Trip",
    startDate: "2024-01-20",
    endDate: "2024-01-22",
    priceCash: 300,
    pricePoints: 6000,
    status: "past",
    bookings: 15,
  },
  {
    id: 5,
    title: "Fall Festival",
    startDate: "2024-10-31",
    endDate: "2024-10-31",
    priceCash: 50,
    pricePoints: 1000,
    status: "upcoming",
    bookings: 45,
  },
]

export default function TripsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [selectedTrip, setSelectedTrip] = useState<(typeof mockTrips)[0] | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isBookingOpen, setIsBookingOpen] = useState(false)

  const filteredTrips = mockTrips.filter((trip) => {
    const matchesSearch = trip.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === "all" || trip.status === filter
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    return status === "upcoming" ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Upcoming</Badge>
    ) : (
      <Badge variant="secondary">Past</Badge>
    )
  }

  const handleBookTrip = (trip: (typeof mockTrips)[0]) => {
    setSelectedTrip(trip)
    setIsBookingOpen(true)
  }

  const handleConfirmBooking = () => {
    if (selectedTrip) {
      console.log(`Booking ${selectedTrip.title} with ${paymentMethod}`)
      setIsBookingOpen(false)
      setSelectedTrip(null)
      setPaymentMethod("cash")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Trips"
          icon={<MapPin className="h-6 w-6" />}
          actionButton={{
            label: "Add Trip",
            onClick: () => console.log("Add trip clicked"),
          }}
        />

        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search trips..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter trips" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trips</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trips Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Start Date</TableHead>
                    <TableHead className="font-semibold">End Date</TableHead>
                    <TableHead className="font-semibold">Price Cash</TableHead>
                    <TableHead className="font-semibold">Price Points</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Bookings</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips.map((trip) => (
                    <TableRow key={trip.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{trip.title}</TableCell>
                      <TableCell>{formatDate(trip.startDate)}</TableCell>
                      <TableCell>{formatDate(trip.endDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="font-medium">${trip.priceCash}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{trip.pricePoints.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{trip.bookings}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Users className="h-4 w-4 mr-1" />
                            View Bookings
                          </Button>
                          {trip.status === "upcoming" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleBookTrip(trip)}
                            >
                              Book Trip
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredTrips.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No trips found</p>
                <p className="text-sm">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Modal */}
        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-blue-600">Book Trip</DialogTitle>
            </DialogHeader>

            {selectedTrip && (
              <div className="space-y-6">
                {/* Trip Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{selectedTrip.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(selectedTrip.startDate)} - {formatDate(selectedTrip.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">${selectedTrip.priceCash} Cash</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{selectedTrip.pricePoints.toLocaleString()} Points</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>Pay with Cash (${selectedTrip.priceCash})</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <RadioGroupItem value="points" id="points" />
                      <Label htmlFor="points" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Coins className="h-4 w-4 text-blue-600" />
                        <span>Pay with Points ({selectedTrip.pricePoints.toLocaleString()})</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Confirm Button */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsBookingOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleConfirmBooking} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Confirm Booking
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
