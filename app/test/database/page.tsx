
// Simple test to check database connection and table structure
"use client";


import { createClient } from "@/lib/supabase";

export default function DatabaseTestPage() {
  const supabase = createClient();

  const testDatabase = async () => {
    try {
      console.log("Testing database connection...");

      // First, let's see if we can connect and what tables exist
      const { data: tables, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public");

      if (tablesError) {
        console.error("Error fetching tables:", tablesError);
        return;
      }

      console.log("Available tables:", tables);

      // Try to get the servants table structure
      const { data: servants, error: servantsError } = await supabase
        .from("servants")
        .select("*")
        .limit(1);

      if (servantsError) {
        console.error("Error fetching from servants table:", servantsError);

        // Let's try to get table info
        const { data: tableInfo, error: tableInfoError } = await supabase
          .from("information_schema.columns")
          .select("column_name, data_type, is_nullable")
          .eq("table_name", "servants")
          .eq("table_schema", "public");

        if (tableInfoError) {
          console.error("Error fetching table info:", tableInfoError);
        } else {
          console.log("Servants table columns:", tableInfo);
        }
      } else {
        console.log("Sample servant data:", servants);
      }

      // Try to get churches
      const { data: churches, error: churchesError } = await supabase
        .from("churches")
        .select("id, name")
        .limit(5);

      if (churchesError) {
        console.error("Error fetching churches:", churchesError);
      } else {
        console.log("Available churches:", churches);
      }
    } catch (err) {
      console.error("General error:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      <button
        onClick={testDatabase}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test Database Connection
      </button>
      <p className="mt-4 text-sm text-gray-600">
        Check the browser console for results
      </p>
    </div>
  );
}
