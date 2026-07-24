"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { clientLogger } from '@/lib/client-logger'

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AssignDioceseAdminDialogProps {
  dioceseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AssignDioceseAdminDialog({
  dioceseId,
  open,
  onOpenChange,
  onSuccess,
}: AssignDioceseAdminDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("search", searchQuery);
      }
      params.append("limit", "50");

      const response = await fetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const { data } = await response.json();
      setUsers(data || []);
    } catch (error) {
      clientLogger.error("Error fetching users", error);
      toast.error("Failed to load users");
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (open) {
      fetchUsers();
    } else {
      // Reset form when dialog closes
      setSelectedUserId("");
      setNotes("");
      setSearchQuery("");
    }
  }, [open, fetchUsers]);

  useEffect(() => {
    if (searchQuery) {
      const timer = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/dioceses/${dioceseId}/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign admin");
      }

      toast.success("Diocese admin assigned successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      clientLogger.error("Error assigning admin", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to assign diocese admin"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Diocese Administrator</DialogTitle>
            <DialogDescription>
              Select a user to grant administrator access to this diocese.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Search Users */}
            <div className="grid gap-2">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-8"
                />
                {searching && (
                  <Loader2 className="absolute end-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* User List */}
            <div className="grid gap-2">
              <Label>Select User *</Label>
              <div className="h-60 overflow-y-auto rounded-md border">
                {users.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-4 text-sm text-muted-foreground">
                    {searching ? "Searching..." : "No users found"}
                  </div>
                ) : (
                  <div className="p-1">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-md text-start transition-colors ${
                          selectedUserId === user.id
                            ? "bg-primary/10 ring-1 ring-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.full_name || ""}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full shrink-0"
                            unoptimized
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium">
                              {(user.full_name || user.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-sm">
                            {user.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="e.g., Primary administrator for region"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedUserId}>
              {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Assign Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
