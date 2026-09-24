"use client";

import { useState, useEffect} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Interface for public keys loaded from Go

export default function CreateCustomerPage() {
  const router = useRouter();

// State

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form values
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");

  // Blocker for init
   useEffect(() => {
    
     async function Initilize() {
       //setLoading(false);
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

    Initilize();
  }, []);

  // Submit form
  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
    };

    try {
      const res = await fetch("http://localhost:3010/customer", {
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
        text: `Customer ${result.customer_name} successfully created!`,
      });

      // reset
      setCustomerName("");
      setCustomerEmail("");

    } catch (err: unknown) {
      // Type-safe error handling without 'any'
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
            href="/customers"
            className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            ← Back to overview
          </Link>
        <h1 className="text-2xl font-bold text-zinc-900">Create new Customer </h1>
        <p className="text-sm text-zinc-500">
          Choose a customer name/e-mail and the backend just create a new sign key
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
          <label htmlFor="customerName" className="block text-sm font-medium text-zinc-700 mb-1">
            Customer name
          </label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="i.e. Lab Ocean Hospital"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
            autoFocus
          />
        </div>
        {/* Input: e-Mail */}
        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-zinc-700 mb-1">
            Customer e-mail
          </label>
          <input
            type="text"
            id="CustomerEmail"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="i.e. customer@example.com"
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