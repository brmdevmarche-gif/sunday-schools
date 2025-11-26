
"use client";

import { ComingSoonPage } from "@/components/coming-soon-page";

export default function ClassGroupsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Class Groups</h1>
        <p className="text-muted-foreground mt-1">
          Manage Sunday School class groups and their assignments
        </p>
      </div>
      
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Class Groups Management
          </h3>
          <p className="text-muted-foreground mb-4">
            This feature is coming soon. You'll be able to manage class groups, assign students and servants, and track class schedules.
          </p>
        </div>
      </div>
    </div>
  );
}