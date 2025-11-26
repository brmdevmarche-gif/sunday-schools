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
  Church,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  Search,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import type { Church as ChurchType, Diocese } from "@/lib/types";

export default function ChurchesPage() {
  const [churches, setChurches] = useState<ChurchType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("churches")
        .select(
          `
          *,
          diocese (
            id,
            name
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChurches(data || []);
    } catch (error) {
      console.error("Error fetching churches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this church?")) return;

    try {
      const { error } = await supabase.from("churches").delete().eq("id", id);
      if (error) throw error;

      setChurches((prev) => prev.filter((church) => church.id !== id));
    } catch (error) {
      console.error("Error deleting church:", error);
      alert("Error deleting church. Please try again.");
    }
  };

  const filteredChurches = churches.filter(
    (church) =>
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (church.diocese?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (church.address || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Churches</h1>
          <p className="text-muted-foreground mt-1">
            Manage churches across your dioceses
          </p>
        </div>
        <Link href="/churches/new">
          <SimpleButton>
            <Plus className="w-4 h-4 mr-2" />
            Add Church
          </SimpleButton>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search churches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Churches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="w-5 h-5" />
            Churches ({filteredChurches.length})
          </CardTitle>
          <CardDescription>All churches in your system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading churches...</div>
          ) : filteredChurches.length === 0 ? (
            <div className="text-center py-8">
              <Church className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No churches found
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No churches match your search."
                  : "Get started by adding your first church."}
              </p>
              {!searchTerm && (
                <Link href="/churches/new">
                  <SimpleButton>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Church
                  </SimpleButton>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Church Name</TableHead>
                    <TableHead>Diocese</TableHead>
                    <TableHead>Priest</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Established</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChurches.map((church) => (
                    <TableRow key={church.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Church className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{church.name}</div>
                            {church.address && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {church.address}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {church.diocese ? (
                          <Badge variant="outline">{church.diocese.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            No diocese
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {church.priest_name ? (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {church.priest_name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Not assigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {church.contact_email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              {church.contact_email}
                            </div>
                          )}
                          {church.contact_phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {church.contact_phone}
                            </div>
                          )}
                          {!church.contact_email && !church.contact_phone && (
                            <span className="text-muted-foreground text-sm">
                              No contact info
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {church.latitude && church.longitude ? (
                          <Badge variant="secondary">
                            <MapPin className="w-3 h-3 mr-1" />
                            Located
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            No coordinates
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {church.established_date ? (
                          new Date(church.established_date).getFullYear()
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/churches/${church.id}/edit`}>
                            <SimpleButton variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </SimpleButton>
                          </Link>
                          <SimpleButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(church.id)}
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
