"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Trophy,
  Clock,
  XCircle,
  CheckCircle2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  User,
  GraduationCap,
  Activity as ActivityIcon,
} from "lucide-react";
import type {
  StudentDetails,
  ActivityParticipation,
  AvailableActivity,
  PointsSummary,
} from "./actions";

interface StudentDetailsClientProps {
  student: StudentDetails;
  activities: {
    participated: ActivityParticipation[];
    available: AvailableActivity[];
  };
  points: PointsSummary;
}

export default function StudentDetailsClient({
  student,
  activities,
  points,
}: StudentDetailsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("participated");

  const getInitials = (name: string | null) => {
    if (!name) return "ST";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      pending: { variant: "outline", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      active: { variant: "default", label: "Active" },
      withdrawn: { variant: "secondary", label: "Withdrawn" },
    };

    const config = statusConfig[status] || {
      variant: "outline" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCompletionBadge = (
    completionStatus: string | null,
    isRevoked: boolean | null
  ) => {
    if (isRevoked) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Revoked
        </Badge>
      );
    }
    if (!completionStatus) return null;

    const config: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
        icon?: typeof Clock;
      }
    > = {
      pending: {
        variant: "outline",
        label: "Pending Review",
        icon: Clock,
      },
      approved: {
        variant: "default",
        label: "Completed",
        icon: CheckCircle2,
      },
      rejected: {
        variant: "destructive",
        label: "Rejected",
        icon: XCircle,
      },
    };

    const item = config[completionStatus] || {
      variant: "outline" as const,
      label: completionStatus,
    };
    const Icon = item.icon;

    return (
      <Badge variant={item.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {item.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const age = student.date_of_birth
    ? new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()
    : null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Student Details</h1>
          <p className="text-sm text-muted-foreground">
            View student information, activities, and points
          </p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.avatar_url || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials(student.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {student.full_name || "Unknown Student"}
              </CardTitle>
              <CardDescription className="mt-1">
                Member since {formatDate(student.created_at)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>

            {student.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">
                    {student.phone}
                  </p>
                </div>
              </div>
            )}

            {student.date_of_birth && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Age</p>
                  <p className="text-sm text-muted-foreground">
                    {age} years ({formatDate(student.date_of_birth)})
                  </p>
                </div>
              </div>
            )}

            {student.gender && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Gender</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {student.gender}
                  </p>
                </div>
              </div>
            )}

            {student.address && (
              <div className="flex items-center gap-3 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {student.address}
                  </p>
                </div>
              </div>
            )}

            {student.diocese_name && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Diocese</p>
                  <p className="text-sm text-muted-foreground">
                    {student.diocese_name}
                  </p>
                </div>
              </div>
            )}

            {student.church_name && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Church</p>
                  <p className="text-sm text-muted-foreground">
                    {student.church_name}
                  </p>
                </div>
              </div>
            )}

            {student.class_assignments &&
              student.class_assignments.length > 0 && (
                <div className="flex items-center gap-3 md:col-span-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Classes</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {student.class_assignments.map((assignment) => (
                        <Badge key={assignment.class_id} variant="secondary">
                          {assignment.class_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-3xl font-bold">{points.total_points}</p>
              </div>
              <Trophy className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">{points.pending_points}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revoked</p>
                <p className="text-3xl font-bold">{points.revoked_points}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">
                  {points.activities_completed}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold">
                  {points.activities_pending}
                </p>
              </div>
              <ActivityIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardDescription>
            View activities this student has participated in and available
            activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="participated">
                Participated ({activities.participated.length})
              </TabsTrigger>
              <TabsTrigger value="available">
                Available ({activities.available.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participated" className="mt-4">
              {activities.participated.length === 0 ? (
                <div className="text-center py-12">
                  <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    No activities participated yet
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Activity</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.participated.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {activity.activity_name}
                            </p>
                            {activity.activity_description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {activity.activity_description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">
                              {activity.points_awarded !== null
                                ? activity.points_awarded
                                : activity.points}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(activity.status)}</TableCell>
                        <TableCell>
                          {getCompletionBadge(
                            activity.completion_status,
                            activity.is_revoked
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(activity.requested_at)}
                        </TableCell>
                        <TableCell>
                          {formatDate(activity.completed_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="available" className="mt-4">
              {activities.available.length === 0 ? (
                <div className="text-center py-12">
                  <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">
                    No available activities at the moment
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activities.available.map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        {activity.image_url && (
                          <div className="relative w-full h-32 mb-3">
                            <Image
                              src={activity.image_url}
                              alt={activity.name}
                              fill
                              className="object-cover rounded-md"
                            />
                          </div>
                        )}
                        <h3 className="font-semibold mb-2">{activity.name}</h3>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">
                              {activity.points} pts
                            </span>
                          </div>
                          {activity.deadline && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(activity.deadline)}
                            </div>
                          )}
                        </div>
                        {activity.max_participants && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Max: {activity.max_participants} participants
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
