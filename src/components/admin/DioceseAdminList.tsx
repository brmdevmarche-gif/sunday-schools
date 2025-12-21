"use client";

import { useState, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import { UserPlus, Trash2, Shield } from "lucide-react";

interface DioceseAdmin {
  id: string;
  diocese_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
  notes: string | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  assigned_by_user?: {
    id: string;
    full_name: string | null;
  };
}

interface DioceseAdminListProps {
  dioceseId: string;
  onAssignClick: () => void;
}

export function DioceseAdminList({
  dioceseId,
  onAssignClick,
}: DioceseAdminListProps) {
  const [admins, setAdmins] = useState<DioceseAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dioceses/${dioceseId}/admins`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch admins (${response.status})`);
      }

      const { data } = await response.json();
      setAdmins(data || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load diocese admins");
    } finally {
      setLoading(false);
    }
  }, [dioceseId]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleRevoke = async (userId: string, userName: string) => {
    if (
      !confirm(`Are you sure you want to revoke admin access for ${userName}?`)
    ) {
      return;
    }

    try {
      setRevoking(userId);
      const response = await fetch(
        `/api/admin/dioceses/${dioceseId}/admins/${userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to revoke admin");
      }

      toast.success("Admin access revoked successfully");
      fetchAdmins();
    } catch (error) {
      console.error("Error revoking admin:", error);
      toast.error("Failed to revoke admin access");
    } finally {
      setRevoking(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diocese Administrators</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Diocese Administrators
            </CardTitle>
            <CardDescription>
              Manage users who can administer this diocese
            </CardDescription>
          </div>
          <Button onClick={onAssignClick} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Admin
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {admins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No administrators assigned to this diocese yet.</p>
            <Button
              onClick={onAssignClick}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign First Admin
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {admin.user.avatar_url ? (
                        <img
                          src={admin.user.avatar_url}
                          alt={admin.user.full_name || ""}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {(admin.user.full_name ||
                              admin.user.email)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span>{admin.user.full_name || "Unknown"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{admin.user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {formatDate(admin.assigned_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {admin.assigned_by_user?.full_name || "System"}
                  </TableCell>
                  <TableCell>
                    {admin.notes ? (
                      <span className="text-sm text-muted-foreground">
                        {admin.notes}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">
                        No notes
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRevoke(
                          admin.user_id,
                          admin.user.full_name || admin.user.email
                        )
                      }
                      disabled={revoking === admin.user_id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
