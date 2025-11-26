// Test utility for servant management functionality

import { createClient } from "@/lib/supabase";

const supabase = createClient();

export async function testServantCreation() {
  console.log("Testing servant creation...");

  try {
    // First check if we have any churches available
    const { data: churches, error: churchError } = await supabase
      .from("churches")
      .select("id, name")
      .limit(1);

    if (churchError) {
      console.error("❌ Error fetching churches:", churchError);
      return false;
    }

    if (!churches || churches.length === 0) {
      console.error(
        "❌ No churches found. Cannot test servant creation without a church."
      );
      return false;
    }

    console.log("✅ Using church:", churches[0]);

    // Test data with minimal required fields
    const testServant = {
      first_name: "Test",
      last_name: "Servant",
      church_id: churches[0].id,
      is_active: true,
    };

    console.log("Attempting to create servant:", testServant);

    // Create servant
    const { data, error } = await supabase
      .from("servants")
      .insert(testServant)
      .select()
      .single();

    if (error) {
      console.error("❌ Servant creation failed:", error);
      return false;
    }

    console.log("✅ Servant created successfully:", data);

    // Clean up - delete the test servant
    await supabase.from("servants").delete().eq("id", data.id);
    console.log("🧹 Test servant deleted");

    return true;
  } catch (err) {
    console.error("❌ Test failed with error:", err);
    return false;
  }
}

export async function testServantUpdate() {
  console.log("Testing servant update...");

  try {
    // Get available church first
    const { data: churches, error: churchError } = await supabase
      .from("churches")
      .select("id, name")
      .limit(1);

    if (churchError || !churches || churches.length === 0) {
      console.error("❌ No churches available for testing");
      return false;
    }

    // Create a test servant first
    const testServant = {
      first_name: "Update",
      last_name: "Test",
      church_id: churches[0].id,
      is_active: true,
    };

    const { data: created, error: createError } = await supabase
      .from("servants")
      .insert(testServant)
      .select()
      .single();

    if (createError) throw createError;

    // Update the servant
    const updatedData = {
      first_name: "Updated",
      role: "Administrator",
    };

    const { data, error } = await supabase
      .from("servants")
      .update(updatedData)
      .eq("id", created.id)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Servant updated successfully:", data);

    // Verify the update
    if (data.first_name === "Updated" && data.role === "Administrator") {
      console.log("✅ Update verification passed");
    } else {
      console.error("❌ Update verification failed");
      return false;
    }

    // Clean up
    await supabase.from("servants").delete().eq("id", created.id);
    console.log("🧹 Test servant deleted");

    return true;
  } catch (err) {
    console.error("❌ Update test failed:", err);
    return false;
  }
}

export async function testServantDelete() {
  console.log("Testing servant deletion...");

  try {
    // Get available church first
    const { data: churches, error: churchError } = await supabase
      .from("churches")
      .select("id, name")
      .limit(1);

    if (churchError || !churches || churches.length === 0) {
      console.error("❌ No churches available for testing");
      return false;
    }

    // Create a test servant first
    const testServant = {
      first_name: "Delete",
      last_name: "Test",
      church_id: churches[0].id,
      is_active: true,
    };

    const { data: created, error: createError } = await supabase
      .from("servants")
      .insert(testServant)
      .select()
      .single();

    if (createError) throw createError;

    // Delete the servant
    const { error } = await supabase
      .from("servants")
      .delete()
      .eq("id", created.id);

    if (error) throw error;

    // Verify deletion
    const { data: deleted } = await supabase
      .from("servants")
      .select()
      .eq("id", created.id)
      .single();

    if (!deleted) {
      console.log("✅ Servant deleted successfully");
      return true;
    } else {
      console.error("❌ Servant deletion failed - record still exists");
      return false;
    }
  } catch (err) {
    console.error("❌ Delete test failed:", err);
    return false;
  }
}

export async function runServantTests() {
  console.log("🧪 Running Servant Management Tests...");
  console.log("=".repeat(50));

  const results = [];

  // Test creation
  results.push(await testServantCreation());

  // Test update
  results.push(await testServantUpdate());

  // Test deletion
  results.push(await testServantDelete());

  console.log("=".repeat(50));
  console.log("📊 Test Results:");
  console.log(`✅ Passed: ${results.filter((r) => r).length}`);
  console.log(`❌ Failed: ${results.filter((r) => !r).length}`);
  console.log(
    `📈 Success Rate: ${(
      (results.filter((r) => r).length / results.length) *
      100
    ).toFixed(1)}%`
  );

  if (results.every((r) => r)) {
    console.log("🎉 All servant management tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Check the logs above.");
  }

  return results.every((r) => r);
}
