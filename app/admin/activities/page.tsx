"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimpleButton } from "@/components/ui/simple-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  Church,
  Search,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { ChurchActivity, Church as ChurchType } from "@/lib/types";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ChurchActivity[]>([]);
  const [churches, setChurches] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [churchFilter, setChurchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch activities with church information
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("church_activities")
        .select(
          `
          *,
          church (
            id,
            name
          )
        `
        )
        .order("start_date", { ascending: false });

      if (activitiesError) throw activitiesError;

      // Fetch churches for filtering
      const { data: churchesData, error: churchesError } = await supabase
        .from("churches")
        .select("id, name")
        .order("name");

      if (churchesError) throw churchesError;

      setActivities(activitiesData || []);
      setChurches(churchesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const { error } = await supabase
        .from("church_activities")
        .delete()
        .eq("id", id);
      if (error) throw error;

      setActivities((prev) => prev.filter((activity) => activity.id !== id));
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Error deleting activity. Please try again.");
    }
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (activity.church?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesChurch =
      churchFilter === "all" || activity.church_id.toString() === churchFilter;

    if (!activity.start_date) return matchesSearch && matchesChurch;

    const now = new Date();
    const activityDate = new Date(activity.start_date);
    const isUpcoming = activityDate > now;
    const isPast = activityDate <= now;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "upcoming" && isUpcoming) ||
      (statusFilter === "past" && isPast);

    return matchesSearch && matchesChurch && matchesStatus;
  });

  const getActivityStatusBadge = (startDate: string, endDate?: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;

    if (now < start) {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          Upcoming
        </Badge>
      );
    } else if (now >= start && now <= end) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          In Progress
        </Badge>
      );
    } else {
      return <Badge variant="secondary">Completed</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activities</h1>
          <p className="text-muted-foreground mt-1">
            Manage church activities and special events
          </p>
        </div>
        <Link href="/activities/new">
          <SimpleButton>
            <Plus className="w-4 h-4 mr-2" />
            Add Activity
          </SimpleButton>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={churchFilter} onValueChange={setChurchFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by church" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Churches</SelectItem>
            {churches.map((church) => (
              <SelectItem key={church.id} value={church.id.toString()}>
                {church.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Activities ({filteredActivities.length})
          </CardTitle>
          <CardDescription>All church activities and events</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No activities found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || churchFilter !== "all" || statusFilter !== "all"
                  ? "No activities match your search criteria."
                  : "Get started by adding your first activity."}
              </p>
              {!searchTerm &&
                churchFilter === "all" &&
                statusFilter === "all" && (
                  <Link href="/activities/new">
                    <SimpleButton>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </SimpleButton>
                  </Link>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Church</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{activity.name}</div>
                            {activity.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {activity.description.length > 60
                                  ? `${activity.description.substring(
                                      0,
                                      60
                                    )}...`
                                  : activity.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.church ? (
                          <div className="flex items-center gap-1">
                            <Church className="w-4 h-4 text-muted-foreground" />
                            {activity.church.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.start_date ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatDate(activity.start_date)}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(activity.start_date)}
                              {activity.end_date &&
                                ` - ${formatTime(activity.end_date)}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No date set
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {activity.max_participants
                              ? `${activity.max_participants} max`
                              : "No limit"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {activity.location}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No location
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.start_date ? (
                          getActivityStatusBadge(
                            activity.start_date,
                            activity.end_date
                          )
                        ) : (
                          <Badge variant="secondary">No Date</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/activities/${activity.id}/edit`}>
                            <SimpleButton variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </SimpleButton>
                          </Link>
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(activity.id)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-4 h-4" />
                          </SimpleButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
