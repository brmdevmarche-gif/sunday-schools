"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Filter,
  Building,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface TripClassStudentsClientProps {
  tripData: {
    trip: any;
    classes: Array<{
      id: string;
      name: string;
      students: Array<{
        id: string;
        full_name: string | null;
        email: string;
        phone: string | null;
        avatar_url: string | null;
        isSubscribed: boolean;
        approval_status: string | null;
        payment_status: string | null;
        registered_at: string | null;
      }>;
    }>;
    totalStudents: number;
    subscribedStudents: number;
  };
  userProfile: any;
}

export default function TripClassStudentsClient({
  tripData,
  userProfile,
}: TripClassStudentsClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<
    "all" | "subscribed" | "unsubscribed"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { trip, classes, totalStudents, subscribedStudents } = tripData;

  // Get currency symbol based on locale
  const getCurrencySymbol = () => {
    return locale === 'ar' ? 'ج.م' : 'E.L';
  };

  function formatDate(dateString: string | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  }

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  }

  // Filter classes and students
  const filteredClasses = classes
    .filter((cls) => {
      if (selectedClass === "all") return true;
      return cls.id === selectedClass;
    })
    .map((cls) => {
      let filteredStudents = cls.students.filter((student) => {
        // Filter by subscription status
        if (subscriptionFilter === "subscribed" && !student.isSubscribed)
          return false;
        if (subscriptionFilter === "unsubscribed" && student.isSubscribed)
          return false;

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            student.full_name?.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query) ||
            student.phone?.toLowerCase().includes(query)
          );
        }

        return true;
      });

      return {
        ...cls,
        students: filteredStudents,
      };
    })
    .filter((cls) => cls.students.length > 0);

  const allFilteredStudents = filteredClasses.flatMap((cls) => cls.students);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/classes")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{trip.name}</h1>
              <Badge
                variant={
                  trip.status === "active" ? "default" : "secondary"
                }
              >
                {trip.status || "active"}
              </Badge>
              {trip.trip_type && (
                <Badge variant="outline">{trip.trip_type}</Badge>
              )}
            </div>
            {trip.description && (
              <p className="text-muted-foreground mt-1">{trip.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Trip Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Subscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subscribedStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalStudents > 0
                ? Math.round((subscribedStudents / totalStudents) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>
        {trip.start_datetime && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {formatDateTime(trip.start_datetime)}
              </div>
            </CardContent>
          </Card>
        )}
        {trip.price_normal !== null && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCurrencySymbol()}{trip.price_normal}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trip Information */}
      {trip.destinations && trip.destinations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trip.destinations.map((dest: any) => (
                <Badge key={dest.id} variant="outline" className="text-sm">
                  <MapPin className="h-3 w-3 mr-1" />
                  {dest.destination_name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter students by class and subscription status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.students.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-sm font-medium">Subscription Status</label>
              <Select
                value={subscriptionFilter}
                onValueChange={(value: any) => setSubscriptionFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="subscribed">Subscribed</SelectItem>
                  <SelectItem value="unsubscribed">Not Subscribed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by name, email, or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students by Class */}
      <div className="space-y-4">
        {filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No students found matching the filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map((cls) => (
            <Card key={cls.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {cls.name}
                </CardTitle>
                <CardDescription>
                  {cls.students.length} student{cls.students.length !== 1 ? "s" : ""}
                  {" - "}
                  {cls.students.filter((s) => s.isSubscribed).length} subscribed,{" "}
                  {cls.students.filter((s) => !s.isSubscribed).length} not
                  subscribed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cls.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={student.avatar_url || undefined}
                          alt={student.full_name || student.email}
                        />
                        <AvatarFallback>
                          {(student.full_name || student.email)
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {student.full_name || student.email}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="truncate">{student.email}</span>
                          {student.phone && (
                            <span className="flex items-center gap-1">
                              <span>{student.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.isSubscribed ? (
                          <>
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div className="text-xs text-right">
                              <p className="font-medium text-green-600">
                                Subscribed
                              </p>
                              {student.approval_status && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs"
                                >
                                  {student.approval_status}
                                </Badge>
                              )}
                              {student.payment_status && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 text-xs ml-1"
                                >
                                  {student.payment_status}
                                </Badge>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-5 w-5 text-gray-400" />
                            <p className="text-xs text-muted-foreground">
                              Not Subscribed
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

