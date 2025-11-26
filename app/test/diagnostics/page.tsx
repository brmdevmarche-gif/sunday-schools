
"use client";


import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<{
    loading: boolean;
    churches: any[];
    servants: any[];
    errors: string[];
  }>({
    loading: true,
    churches: [],
    servants: [],
    errors: [],
  });

  const supabase = createClient();

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: {
      loading: boolean;
      churches: any[];
      servants: any[];
      errors: string[];
    } = {
      loading: false,
      churches: [],
      servants: [],
      errors: [],
    };

    try {
      // Check churches
      const { data: churches, error: churchError } = await supabase
        .from("churches")
        .select("id, name, diocese_id")
        .limit(10);

      if (churchError) {
        results.errors.push(`Churches error: ${churchError.message}`);
      } else {
        results.churches = churches || [];
      }

      // Check servants
      const { data: servants, error: servantsError } = await supabase
        .from("servants")
        .select(
          `
          id, 
          first_name, 
          last_name, 
          email, 
          church_id,
          church (id, name)
        `
        )
        .limit(10);

      if (servantsError) {
        results.errors.push(`Servants error: ${servantsError.message}`);
      } else {
        results.servants = servants || [];
      }
    } catch (err) {
      results.errors.push(`General error: ${err}`);
    }

    setDiagnostics(results);
  };

  const testCreateServant = async () => {
    try {
      if (diagnostics.churches.length === 0) {
        alert("No churches available for testing");
        return;
      }

      const testData = {
        first_name: "Test",
        last_name: "User",
        church_id: diagnostics.churches[0].id,
        email: `test.user.${Date.now()}@example.com`, // Unique email
        is_active: true,
      };

      const { data, error } = await supabase
        .from("servants")
        .insert(testData)
        .select()
        .single();

      if (error) {
        alert(`Error creating servant: ${error.message}`);
      } else {
        alert(
          `Successfully created servant: ${data.first_name} ${data.last_name}`
        );
        // Clean up
        await supabase.from("servants").delete().eq("id", data.id);
        runDiagnostics(); // Refresh data
      }
    } catch (err) {
      alert(`Test failed: ${err}`);
    }
  };

  if (diagnostics.loading) {
    return <div className="p-6">Loading diagnostics...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Database Diagnostics</h1>

      {diagnostics.errors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold">Errors:</h3>
          {diagnostics.errors.map((error: string, index: number) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Churches */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">
            Churches ({diagnostics.churches.length})
          </h2>
          {diagnostics.churches.length === 0 ? (
            <p className="text-gray-500">
              No churches found. You may need to run the seed data script.
            </p>
          ) : (
            <div className="space-y-2">
              {diagnostics.churches.map((church: any) => (
                <div
                  key={church.id}
                  className="border-l-4 border-blue-500 pl-3"
                >
                  <div className="font-medium">{church.name}</div>
                  <div className="text-sm text-gray-600">ID: {church.id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Servants */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">
            Servants ({diagnostics.servants.length})
          </h2>
          {diagnostics.servants.length === 0 ? (
            <p className="text-gray-500">No servants found.</p>
          ) : (
            <div className="space-y-2">
              {diagnostics.servants.map((servant: any) => (
                <div
                  key={servant.id}
                  className="border-l-4 border-green-500 pl-3"
                >
                  <div className="font-medium">
                    {servant.first_name} {servant.last_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    Email: {servant.email || "None"} | Church:{" "}
                    {servant.church?.name || "Unknown"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-x-4">
        <button
          onClick={runDiagnostics}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Refresh Diagnostics
        </button>

        <button
          onClick={testCreateServant}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={diagnostics.churches.length === 0}
        >
          Test Create Servant
        </button>
      </div>

      <div className="mt-6 bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            If no churches are shown, you need to run the database seed script
          </li>
          <li>Churches are required for creating servants</li>
          <li>Test the "Create Servant" functionality with the test button</li>
          <li>Check the servants page to verify everything works properly</li>
        </ol>
      </div>
    </div>
  );
}
