
import { Metadata } from "next";
import { StoreManagement } from "@/components/store-management";

export const metadata: Metadata = {
  title: "Store Management | Knesty Portal",
  description: "Manage church stores, items, and assignments",
};

export default function StoresAdminPage() {
  return (
    <div className="p-6">
      <StoreManagement />
    </div>
  );
}
