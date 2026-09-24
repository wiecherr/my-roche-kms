"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Interface für die aus Go geladenen Public Keys

export default function CreatePlantPage() {
  const router = useRouter();

  // Zustände
  //const [publicKeys, setPublicKeys] = useState<PublicKeyItemNew[]>([]);
  //const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Formular-Values
  //const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  //const [selectedBatchId, setSelectedBatchId] = useState<string>(HARDCODED_BATCHES[0].batch_id);
  const [plantName, setPlantName] = useState<string>("");
  const [plantEmail, setPlantEmail] = useState<string>("");
  // Public Keys von der Go/Gin-API laden
  useEffect(() => {
    
    async function Initialize() {
      /*try {
        setLoading(true);
        const keysRes = await fetch("http://localhost:3010/publickeys", { cache: "no-store" });
        const keysData = await keysRes.json();
        
        const validKeys: PublicKeyItemNew[] = Array.isArray(keysData) ? keysData : [];
        setPublicKeys(validKeys);
        
        if (validKeys.length > 0) {
          setSelectedKeyId(validKeys[0].id);
        }
      } catch (err: unknown) {
        console.error("Error while loading Public Keys:", err);
        setMessage({ type: "error", text: "Could not load public keys from KMS" });
      } finally {
        setLoading(false);
      }*/
    }

    Initialize();
  }, []);

  // Formular absenden
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      plant_name: plantName.trim(),
      plant_email: plantEmail.trim(),
    };

    try {
      const res = await fetch("http://localhost:3010/plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fehler beim Signieren des Tags");
      }

      const result = await res.json();
      setMessage({
        type: "success",
        text: `Plant ${result.plant_name} successfully created!`,
      });

      // zurücksetzen
      setPlantName("");
      setPlantEmail("");

    } catch (err: unknown) {
      // Typsichere Fehlerbehandlung ohne 'any'
      const errorMessage = err instanceof Error ? err.message : "Network Error: An error occurred.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 border-b pb-4">
          <Link
            href="/plants"
            className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            ← Back to overview
          </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Create new Plant </h1>
        <p className="text-sm text-zinc-500">
          Choose a plant name/e-mail and the backend just create a new private/public PEM stream
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
        
        {/* Input: CustomerName */}
        <div>
          <label htmlFor="plantName" className="block text-sm font-medium text-zinc-700 mb-1">
            Plant name
          </label>
          <input
            type="text"
            id="plantName"
            value={plantName}
            onChange={(e) => setPlantName(e.target.value)}
            placeholder="i.e. Lab Ocean Hospital"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
            autoFocus
          />
        </div>
        {/* Input: e-Mail */}
        <div>
          <label htmlFor="plantEmail" className="block text-sm font-medium text-zinc-700 mb-1">
            Plant e-mail
          </label>
          <input
            type="text"
            id="plantEmail"
            value={plantEmail}
            onChange={(e) => setPlantEmail(e.target.value)}
            placeholder="i.e. plant-mannheim@roche.com"
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
            {submitting ? "creating customer ..." : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}