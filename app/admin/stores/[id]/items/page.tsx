
import { Metadata } from "next";
import { StoreItemsManagement } from "@/components/store-items-management";

export const metadata: Metadata = {
  title: "Store Items Management | Knesty Portal",
  description: "Manage store inventory and items",
};

interface StoreItemsPageProps {
  params: {
    id: string;
  };
}

export default function StoreItemsPage({ params }: StoreItemsPageProps) {
  const storeId = parseInt(params.id, 10);

  return (
    <div className="p-6">
      <StoreItemsManagement storeId={storeId} />
    </div>
  );
}
