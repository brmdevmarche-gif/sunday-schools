

import { Metadata } from "next";
import { StoreItemsManagement } from "@/components/store-items-management";

export const metadata: Metadata = {
  title: "Test Store Items | Knesty Portal",
  description: "Test store items management functionality",
};

// Using a test store ID - you can change this to match your actual store
const TEST_STORE_ID = 1;

export default function TestStoreItemsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Store Items Test</h1>
        <p className="text-gray-600">
          Testing store items management for Store ID: {TEST_STORE_ID}
        </p>
      </div>
      <StoreItemsManagement storeId={TEST_STORE_ID} />
    </div>
  );
}
