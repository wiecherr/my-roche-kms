"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewMasterKeyPage() {
  const router = useRouter();

  const HARDCODED_CURVETYPES = [
  { curvetype: "secp256r1", curve_description: "Standards for Efficient Cryptography - SEC 2, 256-bit Random Prime Curve" },
  { curvetype: "secp128r1", curve_description: "Standards for Efficient Cryptography - SEC 2, 128-bit Random Prime Curve" },
  { curvetype: "ed25519", curve_description: "Edwards-curve Digital Signature Algorithm over Curve25519" },
  ];
  // Form states
  const [keyName, setKeyName] = useState("");
  const [rawKey, setRawKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const [selectedCurveType, setSelectedCurveType] = useState<string>(HARDCODED_CURVETYPES[0].curvetype);

  // Submit form
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // POST request to your Go/Gin backend
      const response = await fetch("http://localhost:3010/masterkeyNew", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: keyName,
          raw_key: rawKey, // Processed/stored in the backend
          curve_type: selectedCurveType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Error creating (${response.status})`
        );
      }

      // On success: navigate back to the overview and reload data
      router.push("/masterkeys");
      router.refresh();
    } catch (err) {
      console.error("Error while generating the masterkey:", err);
      setError(err instanceof Error ? err.message : "Error: An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      {/* Navigation / Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <Link
            href="/masterkeys"
            className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            ← Back to overview
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl mt-1">
            Create new Private Global Masterkey
          </h1>
          <p className="text-sm text-zinc-500">
            Choose a name for the new Private Global Master Key
        </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-700">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
        {/* Field: Key Name */}
        <div className="space-y-2">
          <label htmlFor="keyName" className="block text-sm font-medium text-zinc-700">
            Key name / description
          </label>
          <input
            id="keyName"
            type="text"
            required
            placeholder="i. e. mainkey zone A"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* Field: Raw Key / Payload */}
        {/*<div className="space-y-2">
          <label htmlFor="rawKey" className="block text-sm font-medium text-zinc-700">
            Master Key Payload (Hex / String) not used!
          </label>
          <input
            id="rawKey"
            type="text"
            required
            placeholder="i.e. a3f1082b9c..."
            value={rawKey}
            onChange={(e) => setRawKey(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        */}
        {/* Dropdown: Curve Type */}
        <div className="space-y-2">
          <label htmlFor="curvetype" className="block text-sm font-medium text-zinc-700">
            Curve Type:
          </label>
          <select
            id="curvetype"
            value={selectedCurveType}
            onChange={(e) => setSelectedCurveType(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          >
            {HARDCODED_CURVETYPES.map((b) => (
              <option key={b.curvetype} value={b.curvetype}>
                {b.curvetype} — {b.curve_description}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <Link
            href="/masterkeys"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "generating new masterkey..." : "Create Masterkey"}
          </button>
        </div>
      </form>
    </div>
  );
}