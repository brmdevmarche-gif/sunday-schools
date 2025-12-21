"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Link, HardDrive, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface TripImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export default function TripImageUpload({
  value,
  onChange,
}: TripImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(value || "");
  const [driveId, setDriveId] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "drive">("url");

  // Convert Google Drive ID to direct image URL
  function getDriveImageUrl(driveId: string): string {
    // Remove any existing URL parts if user pastes full link
    const idMatch = driveId.match(/[-\w]{25,}/);
    const cleanId = idMatch ? idMatch[0] : driveId;
    return `https://drive.google.com/uc?export=view&id=${cleanId}`;
  }

  // Handle file upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `trips/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("trip-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("trip-images").getPublicUrl(filePath);

      setImageUrl(publicUrl);
      onChange(publicUrl);
      toast.success("Image uploaded successfully!");
    } catch (error: unknown) {
      console.error("Error uploading image:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setIsUploading(false);
    }
  }

  // Handle URL input
  function handleUrlChange(url: string) {
    setImageUrl(url);
    onChange(url);
  }

  // Handle Google Drive ID
  function handleDriveIdSubmit() {
    if (!driveId.trim()) {
      toast.error("Please enter a Google Drive ID");
      return;
    }

    const url = getDriveImageUrl(driveId);
    setImageUrl(url);
    onChange(url);
    toast.success("Google Drive image linked!");
  }

  // Clear image
  function handleClearImage() {
    setImageUrl("");
    setDriveId("");
    onChange("");
  }

  return (
    <div className="space-y-4">
      <Label>Trip Image</Label>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "upload" | "url" | "drive")}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url">
            <Link className="h-4 w-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="drive">
            <HardDrive className="h-4 w-4 mr-2" />
            Google Drive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </>
              )}
            </label>
          </div>
        </TabsContent>

        <TabsContent value="url" className="space-y-4">
          <Input
            type="url"
            value={imageUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          <p className="text-xs text-muted-foreground">
            Enter a direct link to an image hosted online
          </p>
        </TabsContent>

        <TabsContent value="drive" className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={driveId}
              onChange={(e) => setDriveId(e.target.value)}
              placeholder="1a2b3c4d5e6f7g8h9i0j or full Google Drive link"
            />
            <Button type="button" onClick={handleDriveIdSubmit}>
              Apply
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              Enter your Google Drive file ID or paste the full sharing link.
            </p>
            <p className="font-medium">Example ID:</p>
            <code className="bg-muted px-2 py-1 rounded">
              1a2b3c4d5e6f7g8h9i0j
            </code>
            <p className="font-medium mt-2">Or full link:</p>
            <code className="bg-muted px-2 py-1 rounded block break-all">
              https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view
            </code>
            <p className="text-yellow-600 dark:text-yellow-500 mt-2">
              ⚠️ Make sure your Google Drive file is set to &quot;Anyone with
              the link can view&quot;
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Image Preview */}
      {imageUrl && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Trip preview"
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3EImage failed to load%3C/text%3E%3C/svg%3E";
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleClearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 break-all">
              {imageUrl}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
