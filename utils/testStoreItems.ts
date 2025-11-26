import { createClient } from "@/lib/supabase";

// Test function to verify store item creation
export async function testStoreItemCreation(storeId: number) {
  const supabase = createClient();

  console.log(`Testing store item creation for store ${storeId}...`);

  // Test data for a new store item
  const testItem = {
    store_id: storeId,
    name: "Test Item",
    description: "This is a test item for validation",
    price_points: 100,
    price_cash: 5.99,
    stock_quantity: 50,
    category: "Test Category",
    image_url: "https://via.placeholder.com/300x300.png?text=Test+Item",
    is_active: true,
    requires_approval: false,
  };

  try {
    // Test 1: Create new item
    console.log("Creating test item...");
    const { data: newItem, error: createError } = await supabase
      .from("store_items")
      .insert(testItem)
      .select()
      .single();

    if (createError) {
      console.error("Failed to create item:", createError);
      return false;
    }

    console.log("Item created successfully:", newItem);

    // Test 2: Verify item was created
    console.log("Verifying item exists...");
    const { data: verifyItem, error: verifyError } = await supabase
      .from("store_items")
      .select("*")
      .eq("id", newItem.id)
      .single();

    if (verifyError) {
      console.error("Failed to verify item:", verifyError);
      return false;
    }

    console.log("Item verification successful:", verifyItem);

    // Test 3: Update the item
    console.log("Testing item update...");
    const { error: updateError } = await supabase
      .from("store_items")
      .update({
        name: "Updated Test Item",
        price_points: 150,
      })
      .eq("id", newItem.id);

    if (updateError) {
      console.error("Failed to update item:", updateError);
      return false;
    }

    console.log("Item updated successfully");

    // Test 4: Delete the test item
    console.log("Cleaning up test item...");
    const { error: deleteError } = await supabase
      .from("store_items")
      .delete()
      .eq("id", newItem.id);

    if (deleteError) {
      console.error("Failed to delete test item:", deleteError);
      return false;
    }

    console.log("Test item deleted successfully");
    console.log("All store item tests passed! ✅");
    return true;
  } catch (err) {
    console.error("Test failed with error:", err);
    return false;
  }
}

// Test function to verify store exists before testing items
export async function testStoreExists(storeId: number) {
  const supabase = createClient();

  try {
    const { data: store, error } = await supabase
      .from("stores")
      .select("id, name")
      .eq("id", storeId)
      .single();

    if (error) {
      console.error("Store not found:", error);
      return false;
    }

    console.log("Store found:", store);
    return true;
  } catch (err) {
    console.error("Error checking store:", err);
    return false;
  }
}

// Complete test suite
export async function runStoreItemTests(storeId?: number) {
  console.log("🧪 Starting Store Item Tests...");

  // If no storeId provided, try to find any store
  if (!storeId) {
    const supabase = createClient();
    const { data: stores } = await supabase
      .from("stores")
      .select("id")
      .limit(1);

    if (!stores || stores.length === 0) {
      console.error("No stores found in database");
      return false;
    }

    storeId = stores[0].id;
    console.log(`Using store ID: ${storeId}`);
  }

  // Test store exists
  const storeExists = await testStoreExists(storeId!);
  if (!storeExists) {
    console.error("Store does not exist, cannot test items");
    return false;
  }

  // Test item operations
  const itemTestsPassed = await testStoreItemCreation(storeId!);

  if (itemTestsPassed) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("❌ Some tests failed");
  }

  return itemTestsPassed;
}
