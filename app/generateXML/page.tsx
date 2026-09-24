"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Interface for public keys loaded from Go

interface PublicKeyItemNew {
  id:               string;
  publickey_name:   string;
  masterkey_id:     string;
  publickey_raw_x:  string;
  publickey_raw_y:  string;
  created_at:       string;
}


export default function CreateGenerateXML() {
  const router = useRouter();

  // States
  const [publicKeys, setPublicKeys] = useState<PublicKeyItemNew[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form values
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
   const [filename, setFilename] = useState<string>("");

  // Load public keys from the Go/Gin API
  useEffect(() => {
    async function fetchPublicKeys() {
      try {
        setLoading(true);
        const keysRes = await fetch("http://localhost:3010/tagitems", { cache: "no-store" });
        const keysData = await keysRes.json();
        
        const validKeys: PublicKeyItemNew[] = Array.isArray(keysData) ? keysData : [];
        setPublicKeys(validKeys);
        
        if (validKeys.length > 0) {
          setSelectedKeyId(validKeys[0].id);
        }
      } catch (err: unknown) {
        console.error("Error during loading RFID tags", err);
        setMessage({ type: "error", text: "RFID Tags could not be loaded from the KMS" });
      } finally {
        setLoading(false);
      }
    }

    fetchPublicKeys();
  }, []);

  // Submit form
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      key_id: selectedKeyId,
      //batch_id: selectedBatchId,
      filename: filename.trim(),
    };

    try {
      const res = await fetch("http://localhost:3010/generatexml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error while generating XML file");
      }

      const result = await res.json();
      setMessage({
        type: "success",
        text: `XML file ${result.filename} succesfully generated!`,
      });

      // Reset RFID UID
      setFilename("");
    } catch (err: unknown) {
      // Type-safe error handling without 'any'
      const errorMessage = err instanceof Error ? err.message : "Network-Error catched";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500">Load all active RFID Tags...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 border-b pb-4">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          ← Back to home
        </Link>        <h1 className="text-2xl font-bold text-zinc-900">Generate XML KeyLibrary</h1>
        <p className="text-sm text-zinc-500">
          Please select one RFID Tage and put a valid filename in the second edit field.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-md p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
        


        {/* Dropdown: Public Key */}
        <div className="space-y-2">
          <label htmlFor="masterKeySelect" className="block text-sm font-medium text-zinc-700">
            Please select one RFID Tag:
          </label>
          
          {loading ? (
            <div className="h-10 w-full animate-pulse rounded-md bg-zinc-100 border border-zinc-200" />
          ) : (
            <select
              id="publicKey"
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {publicKeys.length === 0 ? (
                <option value="" disabled>No RFID tags found</option>
              ) : (
                publicKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.id} 
                  </option>
                ))
              )}
            </select>
          )}
          <p className="text-xs text-zinc-400">
            The public key will be together with the temp. production key will be placed in the XML file, + xtagxml
          </p>
        </div>

        {/* Input: FileName */}
        <div>
          <label htmlFor="rfidUid" className="block text-sm font-medium text-zinc-700 mb-1">
            Filename *.xml will be added: (for DEMO modus the filename is fix!)
          </label>
          <input
            type="text"
            id="rfidUid"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="z. B. keylibrary.xml"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
            autoFocus
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "generating XML File..." : "Generate XML File"}
          </button>
        </div>
      </form>
    </div>
  );
}