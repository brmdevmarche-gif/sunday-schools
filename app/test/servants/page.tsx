
"use client";


import { useState } from "react";
import { runServantTests } from "@/utils/testServants";

export default function TestServantsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;

    const logs: string[] = [];

    console.log = (...args) => {
      const message = args.join(" ");
      logs.push(`LOG: ${message}`);
      setResults((prev) => [...prev, `LOG: ${message}`]);
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.join(" ");
      logs.push(`ERROR: ${message}`);
      setResults((prev) => [...prev, `ERROR: ${message}`]);
      originalError(...args);
    };

    try {
      await runServantTests();
    } catch (err) {
      console.error("Test suite failed:", err);
    }

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    setIsRunning(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Servant Tests</h1>

      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? "Running Tests..." : "Run Servant Tests"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
          <h2 className="text-white text-lg mb-3">Test Results:</h2>
          {results.map((result, index) => (
            <div
              key={index}
              className={`mb-1 ${
                result.includes("ERROR")
                  ? "text-red-400"
                  : result.includes("✅")
                  ? "text-green-400"
                  : result.includes("❌")
                  ? "text-red-400"
                  : "text-gray-300"
              }`}
            >
              {result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
