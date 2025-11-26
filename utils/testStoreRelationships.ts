import { createClient } from "@/lib/supabase";

// Test function to check if the stores relationship works
export async function testStoreRelationships() {
  const supabase = createClient();

  console.log("Testing basic stores query...");

  // Test 1: Basic stores query
  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("*")
    .limit(5);

  if (storesError) {
    console.error("Basic stores query failed:", storesError);
    return;
  }

  console.log("Basic stores query success:", stores);

  // Test 2: Stores with churches
  console.log("Testing stores with churches...");
  const { data: storesWithChurches, error: churchError } = await supabase
    .from("stores")
    .select(
      `
      *,
      churches (
        id,
        name
      )
    `
    )
    .limit(5);

  if (churchError) {
    console.error("Stores with churches query failed:", churchError);
  } else {
    console.log("Stores with churches success:", storesWithChurches);
  }

  // Test 3: Stores with manager (using the foreign key relationship)
  console.log("Testing stores with manager...");
  const { data: storesWithManager, error: managerError } = await supabase
    .from("stores")
    .select(
      `
      *,
      manager:servants!manager_id (
        id,
        first_name,
        last_name
      )
    `
    )
    .limit(5);

  if (managerError) {
    console.error("Stores with manager query failed:", managerError);

    // Try alternative approach
    console.log("Trying alternative manager query...");
    const { data: altManager, error: altError } = await supabase
      .from("stores")
      .select(
        `
        *,
        servants!stores_manager_id_fkey (
          id,
          first_name,
          last_name
        )
      `
      )
      .limit(5);

    if (altError) {
      console.error("Alternative manager query failed:", altError);
    } else {
      console.log("Alternative manager query success:", altManager);
    }
  } else {
    console.log("Stores with manager success:", storesWithManager);
  }
}
