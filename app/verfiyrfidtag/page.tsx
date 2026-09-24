"use client";

import React, { useState } from "react";
import Link from "next/link";

import { useEffect } from "react";
//import { useRouter } from "next/navigation";

interface VerificationResult {
  is_valid: boolean;
  message: string;
  processed_at: string;
}

interface PublicKeyItemNew {
  id:              string;
  publickey_name:  string;
  masterkey_id:    string;
  publickey_raw_x:   string;
  publickey_raw_y:   string;
  prodmasterkey_raw: string;
  created_at:      string;
}
interface RfidTagItem {
  id:              string;
  publickey_name:  string;
  uid:             string;
  signature_r:     string;
  signature_s:     string;
  created_at:      string;
}

// Fest hinterlegte Batch-Liste für die Testphase
const HARDCODED_BATCHES = [
  { batch_id: "BATCH-2026-001", fluid_type: "Reagent-A-High-Purity" },
  { batch_id: "BATCH-2026-002", fluid_type: "Reagent-B-Standard-Buffer" },
  { batch_id: "BATCH-2026-003", fluid_type: "Reagent-C-Enzyme-Sol" },
  { batch_id: "BATCH-TEST-DEV", fluid_type: "Water-Validation-Dummy" },
];

export default function VerifyOfflinePage() {
  // Formular-States
 // const [rfidUid, setRfidUid] = useState("");
 // const [batchId, setBatchId] = useState("");
 // const [keyId, setKeyId] = useState("2"); // Default auf Key-Version 2 (z. B. v2026)
  const [sigR, setSigR] = useState("");
  const [sigS, setSigS] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>(HARDCODED_BATCHES[0].batch_id);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [selectedRfidTagId, setSelectedRfifTagId] = useState<string>("");
  const [publicKeys, setPublicKeys] = useState<PublicKeyItemNew[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rfidtagitems, setRfidTagItems] = useState<RfidTagItem[]>([]);



  // Status-States
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Public Keys von der Go/Gin-API laden
    useEffect(() => {
      async function fetchPublicKeys() {
        try {
          setLoading(true);
          const keysRes = await fetch("http://localhost:3010/publickeys", { cache: "no-store" });
          const keysData = await keysRes.json();
          
          const validKeys: PublicKeyItemNew[] = Array.isArray(keysData) ? keysData : [];
          setPublicKeys(validKeys);
          
          if (validKeys.length > 0) {
            setSelectedKeyId(validKeys[0].id);
          }
        } catch (err: unknown) {
          console.error("Fehler beim Laden der Public Keys:", err);
          setMessage({ type: "error", text: "Public Keys konnten nicht vom KMS-Server geladen werden." });
        } finally {
          setLoading(false);
        }
      }
  
      fetchPublicKeys();
    }, []);

  // RFID Tags von der Go/Gin-API laden
    useEffect(() => {
      async function fetchRfidTagItems() {
        try {
          setLoading(true);
          const rfidtagsRes = await fetch("http://localhost:3010/tagitems", { cache: "no-store" });
          const rfidtagsData = await rfidtagsRes.json();
          
          const validRfidTags: RfidTagItem[] = Array.isArray(rfidtagsData) ? rfidtagsData : [];
          setRfidTagItems(validRfidTags);
          
          if (validRfidTags.length > 0) {
            setSelectedRfifTagId(validRfidTags[0].id);
          }
        } catch (err: unknown) {
          console.error("Fehler beim Laden der Rfid Tags:", err);
          setMessage({ type: "error", text: "RFID tags could not be loaded from the KMS server." });
        } finally {
          setLoading(false);
        }
      }
  
      fetchRfidTagItems();
    }, []);

const selectedRfidTagObject = rfidtagitems.find(b => b.id === selectedRfidTagId);
const uidtext = selectedRfidTagObject ? selectedRfidTagObject.uid : selectedRfidTagId;

  const handleVerify = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:3010/verify-offline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rfid_uid: uidtext,
          batch_id: selectedBatchId,
          key_id: selectedKeyId,
          signature_r: sigR,
          signature_s: sigS,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP-Fdehler: ${response.statusText}`);
      }

      const data: VerificationResult = await response.json();
      setResult(data);
    } catch (err: unknown) {
      // Absolut sicheres TypeScript-Error-Handling (kein 'any')
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error has occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-8">
      {/* Navigation & Header */}
      <div className="space-y-2">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
          Offline Security API Simulator
        </h1>
        <p className="text-sm text-zinc-500">
          Simulate offline verification on the customer machine. Enter the RFID tag data to mathematically verify the signature against the UID and batch number.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-1">
        {/* Formular-Karte */}
        
        {/*rückmeldung */}

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

        <form onSubmit={handleVerify} className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900 border-b pb-3">
            RFID-Tag & Instrument-Content
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* RFID UID */}
            
            <div className="space-y-2">
                <label htmlFor="masterKeySelect" className="block text-sm font-medium text-zinc-700">
                    UID selection
                </label>
          
          {loading ? (
            <div className="h-10 w-full animate-pulse rounded-md bg-zinc-100 border border-zinc-200" />
          ) : (
            <select
              id="rfidUid"
              value={selectedRfidTagId}
              onChange={(e) => setSelectedRfifTagId(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {rfidtagitems.length === 0 ? (
                <option value="" disabled>No RFID tags found</option>
              ) : (
                rfidtagitems.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.uid}  
                  </option>
                ))
              )}
            </select>
          )}


         
            </div>
            
            {/* Batch ID */}
            <div>
            <label htmlFor="batch" className="block text-sm font-medium text-zinc-700 mb-1">
                    Active Batch-ID (Charge)
            </label>
            <select
            id="batch"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          >
            {HARDCODED_BATCHES.map((b) => (
              <option key={b.batch_id} value={b.batch_id}>
                {b.batch_id} — {b.fluid_type}
              </option>
            ))}
          </select>
        </div>
    
          </div>
           
          {/* Key ID / Version Zeiger */}
          
          
          <div className="space-y-2">
          <label htmlFor="masterKeySelect" className="block text-sm font-medium text-zinc-700">
            Public Key selection
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
                <option value="" disabled>No master keys found</option>
              ) : (
                publicKeys.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.publickey_name} {key.id} 
                  </option>
                ))
              )}
            </select>
          )}
          <p className="text-xs text-zinc-400">
            The public key available on the instrument or distributed via gDrive.
          </p>
        </div>

          <h2 className="text-lg font-semibold text-zinc-900 border-b pb-3 pt-2">
            Cryptographic signature (R & S)
          </h2>

          <div className="space-y-4">
            {/* Signature R */}
            <div className="space-y-1.5">
              <label htmlFor="sigR" className="text-xs font-medium text-zinc-700">
                Signature Value R (Hex)
              </label>
              <textarea
                id="sigR"
                
                rows={2}
                placeholder="z. B. 4a2b1c0d4f..."
                value={sigR}
                onChange={(e) => setSigR(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Signature S */}
            <div className="space-y-1.5">
              <label htmlFor="sigS" className="text-xs font-medium text-zinc-700">
                Signature Value S (Hex)
              </label>
              <textarea
                id="sigS"
                
                rows={2}
                placeholder="z. B. 7f8e9d0c1b..."
                value={sigS}
                onChange={(e) => setSigS(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md py-2 text-sm font-semibold text-white shadow transition-colors ${
              loading
                ? "bg-zinc-400 cursor-not-allowed"
                : "bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950"
            }`}
          >
            {loading ? "Executing offline crypto check..." : "Verify Container Offline"}
          </button>
        </form>

        {/* Ergebnisse & Fehleranzeige */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <h3 className="font-semibold">Simulation error</h3>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div
            className={`rounded-xl border p-6 space-y-4 shadow-sm ${
              result.is_valid
                ? "border-emerald-200 bg-emerald-50/50"
                : "border-rose-200 bg-rose-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-xl font-bold ${
                  result.is_valid ? "text-emerald-800" : "text-rose-800"
                }`}
              >
                {result.is_valid ? "✓ VERIFIED (Original)" : "✗ REJECTED (Invalid)"}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  result.is_valid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {result.is_valid ? "Authentic" : "Untrusted / Clone"}
              </span>
            </div>

            <p className="text-sm text-zinc-700">{result.message}</p>

            <div className="text-xs text-zinc-400 font-mono border-t pt-3">
              Verification Timestamp: {new Date(result.processed_at).toLocaleString("de-DE")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hilfsfunktion zur Beseitigung der Deprecation-Warnung bei Forms
//function handleSubmit(fn: (e: React.FormEvent<HTMLFormElement>) => Promise<void>) {
//  return (e: React.FormEvent<HTMLFormElement>) => {
//    e.preventDefault();
//    fn(e).catch((err) => console.error("Unhandled error in form submit: ", err));
//  };
//}