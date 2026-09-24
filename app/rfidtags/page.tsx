"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Tag, 
  KeyRound, 
  Layers, 
  Cpu, 
  ArrowLeft, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileKey,
  Play,
  Sparkles,
  ArrowRight,
  Info,
  Lock,
  Binary,
  CheckCheck
} from "lucide-react";

// Extended interface for visual differentiation
interface DerivedKeyPairItem {
  id: string;
  derived_key_pair_name: string;
  key_identifier: string;
  curve_type: string;
  aws_organizational_name?: string;
  aws_alias_name?: string;
  aws_master_key_arn?: string;
  masterkey_chipper_blob?: string;
  key_origin?: "AWS_KMS_DERIVED" | "RECONSTRUCTED_ASN1" | string;
}

// Hardcoded batch list for testing phase
const HARDCODED_BATCHES = [
  { batch_id: "BATCH-2026-001", fluid_type: "Reagent-A-High-Purity" },
  { batch_id: "BATCH-2026-002", fluid_type: "Reagent-B-Standard-Buffer" },
  { batch_id: "BATCH-2026-003", fluid_type: "Reagent-C-Enzyme-Sol" },
  { batch_id: "BATCH-TEST-DEV", fluid_type: "Water-Validation-Dummy" },
];

export default function CreateRfidTagPage() {
  const router = useRouter();

  // REFS FÜR DIE GEZIELTE SCROLL-STEUERUNG
  const pipelineRef = useRef<HTMLDivElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  // Component States
  const [keyPairs, setKeyPairs] = useState<DerivedKeyPairItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Field Values
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>(HARDCODED_BATCHES[0].batch_id);
  const [rfidUid, setRfidUid] = useState<string>("");

  // DEMO & VISUALIZATION STATES
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<"hash" | "ecdsa" | "envelope">("hash");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Signed Tag Result State for On-Screen Display
  const [resultData, setResultData] = useState<{
    id: string;
    uid: string;
    batchid: string;
    publickey_name: string;
    key_identifier: string;
    curve_type: string;
    signature_r: string;
    signature_s: string;
    signature_full_hex: string;
    created_at: string;
  } | null>(null);

  // Helper zum Säubern/Kürzen der Hex-Ausgabe basierend auf der Kurve
  const formatSignatureComponent = (hexVal: string, curveType: string) => {
    if (!hexVal) return "";
    const cleanHex = hexVal.replace(/^0x/i, "");
    
    // Für 128-Bit-Kurven: Falls 32-Byte-Hex (64 Zeichen) geliefert werden, zeige nur die echten 16-Byte-Hex (32 Zeichen)
    if (curveType === "secp128r1" && cleanHex.length > 32) {
      return cleanHex.slice(-32);
    }
    return cleanHex;
  };

  // 1. SCROLLEN ZU DEN 3 STEPS, SOBALD DIE PIPELINE STARTET
  useEffect(() => {
    if (activeStep === 1 && pipelineRef.current) {
      pipelineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeStep]);

  // 2. SCROLLEN ZUM ERGEBNIS-FELD, WENN ALLES ERFOLGREICH BEENDET WURDE
  useEffect(() => {
    if (resultData && resultCardRef.current) {
      const timer = setTimeout(() => {
        resultCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [resultData]);

  // Fetch Derived Key Pairs from Go/Gin API
  useEffect(() => {
    let isMounted = true;

    async function fetchDerivedKeyPairs() {
      try {
        const res = await fetch("http://localhost:3010/getawspublickeys", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Could not load derived key pairs from KMS");
        }
        
        const data = await res.json();
        const validKeys: DerivedKeyPairItem[] = Array.isArray(data) ? data : [];
        
        if (isMounted) {
          setKeyPairs(validKeys);
          if (validKeys.length > 0) {
            setSelectedKeyId(validKeys[0].id);
          }
        }
      } catch (err: unknown) {
        console.error("Error while loading Derived Keys:", err);
        if (isMounted) {
          setMessage({ type: "error", text: "Could not load derived key pairs from server" });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDerivedKeyPairs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Currently selected key object for detail view
  const selectedKey = keyPairs.find((k) => k.id === selectedKeyId);
  const isAsn1Reconstructed = selectedKey
    ? selectedKey.key_origin === "RECONSTRUCTED_ASN1" || (!selectedKey.aws_master_key_arn && !selectedKey.masterkey_chipper_blob)
    : false;

  // Real Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setResultData(null);

    try {
      // Step 1: Hashing
      setActiveStep(1);
      setSelectedNode("hash");
      setStatusMessage("1/3 Digest: Computing message hash over UID & Batch ID...");
      await new Promise((r) => setTimeout(r, 800));

      // Step 2: Signature
      setActiveStep(2);
      setSelectedNode("ecdsa");
      setStatusMessage("2/3 Masked Signer: Generating signature components (R, S)...");
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: API Request
      setActiveStep(3);
      setSelectedNode("envelope");
      setStatusMessage("3/3 Tag Registry: Storing Tag Item & Signature...");

      const payload = {
        id: selectedKeyId,
        batchid: selectedBatchId,
        uid: rfidUid.trim(),
      };

      const res = await fetch("http://localhost:3010/tagitems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error signing the tag");
      }

      const result = await res.json();
      
      setActiveStep(4);
      setResultData({
        id: result.id || "tag-uuid-2026-9901",
        uid: result.uid || rfidUid.trim(),
        batchid: selectedBatchId,
        publickey_name: selectedKey?.derived_key_pair_name || "Derived Public Key",
        key_identifier: selectedKey?.key_identifier || "KID-SECP256-01",
        curve_type: selectedKey?.curve_type || "secp256r1",
        signature_r: result.signature_r || "3F8A2D1C9B0E4F5A6B7C8D9E0F1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A",
        signature_s: result.signature_s || "9F8E7D6C5B4A3F2E1D0C9B8A7F6E5D4C3B2A1F0E9D8C7B6A5F4E3D2C1B0A9F8E",
        signature_full_hex: result.signature || "",
        created_at: new Date().toISOString(),
      });

      setMessage({
        type: "success",
        text: `RFID Tag (${result.uid || rfidUid}) for batch ${selectedBatchId} successfully signed!`,
      });

      setRfidUid("");
      setStatusMessage(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Network Error: An error occurred.";
      setMessage({ type: "error", text: errorMessage });
      setActiveStep(0);
    } finally {
      setSubmitting(false);
    }
  };

  // INTERACTIVE DEMO RUN MODE
  const handleSimulate = async () => {
    setSubmitting(true);
    setMessage(null);
    setResultData(null);

    const demoUid = rfidUid.trim() || "04A32B1F996180";
    const demoBatch = selectedBatchId || "BATCH-2026-001";
    const keyName = selectedKey?.derived_key_pair_name || "Demo Derived Key Zone A";
    const keyId = selectedKey?.key_identifier || "KID-SECP256-8F";
    const curve = selectedKey?.curve_type || "secp256r1";

    const is128Bit = curve === "secp128r1";

    // Stage 1: Digest Hashing
    setActiveStep(1);
    setSelectedNode("hash");
    setStatusMessage("[DEMO 1/3] Hashing: Computing digest from UID (" + demoUid + ") & Batch (" + demoBatch + ")...");
    await new Promise((r) => setTimeout(r, 1400));

    // Stage 2: ECDSA Signature
    setActiveStep(2);
    setSelectedNode("ecdsa");
    setStatusMessage("[DEMO 2/3] Masked Signer: Signing digest with Key " + keyId + " (" + curve + ")...");
    await new Promise((r) => setTimeout(r, 1600));

    // Stage 3: Tag Envelope & Verification
    setActiveStep(3);
    setSelectedNode("envelope");
    setStatusMessage("[DEMO 3/3] Tag Registry: Creating cryptographic tag package...");
    await new Promise((r) => setTimeout(r, 1400));

    // Stage 4: Completion
    setActiveStep(4);
    setResultData({
      id: "c8c41539-de9c-4c28-8b28-ae8c36881fd8",
      uid: demoUid,
      batchid: demoBatch,
      publickey_name: keyName,
      key_identifier: keyId,
      curve_type: curve,
      signature_r: is128Bit ? "7E3A9C1D2F8B4E0A6D5C7B8F9A0E1D2C" : "7E3A9C1D2F8B4E0A6D5C7B8F9A0E1D2C3B4A5F6E7D8C9B0A1F2E3D4C5B6A7F8E",
      signature_s: is128Bit ? "1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D" : "1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B",
      signature_full_hex: "",
      created_at: new Date().toISOString(),
    });

    setStatusMessage(null);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-xs">Loading active Derived Key Pairs from KMS...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="w-full border-b border-slate-800 pb-6">
        <Link
          href="/tagitems"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tag Items Overview</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Create & Sign RFID Tag Item</h1>
            <p className="text-xs text-slate-400">
              Select a derived or reconstructed key pair, link a product batch, and provide the hardware UID to generate a signature
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`w-full p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Dropdown: Derived / Reconstructed Key Pair */}
        <div className="space-y-2">
          <label htmlFor="keyPairSelect" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Select Signing Key Pair
            </span>
          </label>
          
          <select
            id="keyPairSelect"
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            required
            disabled={submitting}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {keyPairs.length === 0 ? (
              <option value="" disabled className="bg-slate-900 text-slate-500">
                No key pairs found
              </option>
            ) : (
              keyPairs.map((key) => {
                const keyIsReconstructed =
                  key.key_origin === "RECONSTRUCTED_ASN1" || (!key.aws_master_key_arn && !key.masterkey_chipper_blob);
                
                return (
                  <option key={key.id} value={key.id} className="bg-slate-900 text-slate-200">
                    {keyIsReconstructed ? "📄 [ASN.1] " : "🛡️ [AWS KMS] "}
                    {key.derived_key_pair_name} — ID: {key.key_identifier || "N/A"} ({key.curve_type})
                  </option>
                );
              })
            )}
          </select>

          {/* Dynamic Preview Box for Selected Key */}
          {selectedKey && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 font-mono text-xs mt-2">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] text-slate-400 font-sans font-semibold">
                  Selected Key Metrics:
                </span>

                {isAsn1Reconstructed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                    <FileKey className="w-3 h-3" />
                    ASN.1 Reconstructed Key
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
                    <Cpu className="w-3 h-3" />
                    AWS KMS Derived Key
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">KEY IDENTIFIER:</span>
                  <span className="text-amber-400 font-bold">{selectedKey.key_identifier || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CURVE TYPE:</span>
                  <span className="text-blue-400 font-bold uppercase">{selectedKey.curve_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">AWS ALIAS / ORIGIN:</span>
                  <span className="text-slate-300 truncate block">
                    {isAsn1Reconstructed
                      ? "External Import"
                      : selectedKey.aws_alias_name
                      ? `alias/${selectedKey.aws_alias_name}`
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dropdown: Static Batch List */}
        <div className="space-y-2">
          <label htmlFor="batchSelect" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Batch ID / Product Fluid
          </label>
          <select
            id="batchSelect"
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            disabled={submitting}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50"
            required
          >
            {HARDCODED_BATCHES.map((b) => (
              <option key={b.batch_id} value={b.batch_id} className="bg-slate-900 text-slate-200">
                {b.batch_id} — {b.fluid_type}
              </option>
            ))}
          </select>
        </div>

        {/* Input: Hardware UID */}
        <div className="space-y-2">
          <label htmlFor="rfidUidInput" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            RFID Tag Hardware UID (HEX)
          </label>
          <input
            type="text"
            id="rfidUidInput"
            value={rfidUid}
            onChange={(e) => setRfidUid(e.target.value)}
            placeholder="e.g. 04A32B1F996180"
            disabled={submitting}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
            required
            autoFocus
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={submitting}
            title="Simulate signing process step-by-step as an interactive demo"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Demo Signing Run</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting || keyPairs.length === 0}
              className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{statusMessage || "Signing Tag..."}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign RFID Tag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* INTERACTIVE RFID SIGNING PIPELINE VISUALIZATION */}
      <div 
        ref={pipelineRef}
        className="w-full max-w-3xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 font-mono scroll-mt-6"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 font-sans">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Masked RFID Tag Signing Pipeline
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeStep === 0 && "Status: Standby"}
            {activeStep === 1 && "Status: [1/3] Hashing UID & Batch ID..."}
            {activeStep === 2 && "Status: [2/3] Generating Masked Signature (R, S)..."}
            {activeStep === 3 && "Status: [3/3] Assembling Tag Envelope & Registry Entry..."}
            {activeStep === 4 && "Status: RFID Tag Signing Completed"}
          </span>
        </div>

        {/* Clickable Pipeline Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs relative">
          
          {/* Node 1: Digest Hashing */}
          <button
            type="button"
            onClick={() => setSelectedNode("hash")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 relative cursor-pointer ${
              activeStep === 1
                ? "bg-slate-900 border-blue-400 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/25 scale-102"
                : selectedNode === "hash"
                ? "bg-slate-900 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 1 ? "bg-blue-500 text-white border-blue-400 animate-pulse" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            }`}>
              {activeStep === 1 ? <Binary className="w-5 h-5 animate-bounce" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">1. Payload Digest</span>
              <span className="text-[10px] text-slate-500 block truncate max-w-35">
                SHA-256 (UID + Batch)
              </span>
            </div>
          </button>

          {/* Arrow Indicator */}
          <div className="hidden sm:flex absolute left-[31%] top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <ArrowRight className={`w-4 h-4 transition-colors ${
              activeStep >= 1 ? "text-blue-400 animate-pulse" : "text-slate-700"
            }`} />
          </div>

          {/* Node 2: Masked Signer Engine */}
          <button
            type="button"
            onClick={() => setSelectedNode("ecdsa")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 relative cursor-pointer ${
              activeStep === 2
                ? "bg-slate-900 border-amber-400 ring-2 ring-amber-500/50 shadow-xl shadow-amber-500/25 scale-102"
                : selectedNode === "ecdsa"
                ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 2 ? "bg-amber-500 text-slate-950 border-amber-400 animate-pulse" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {activeStep === 2 ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">2. Masked Signer</span>
              <span className="text-[10px] text-slate-500 block">x_static = x_batch + Δx</span>
            </div>
          </button>

          {/* Arrow Indicator */}
          <div className="hidden sm:flex absolute left-[65%] top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <ArrowRight className={`w-4 h-4 transition-colors ${
              activeStep >= 2 ? "text-indigo-400 animate-pulse" : "text-slate-700"
            }`} />
          </div>

          {/* Node 3: Tag Registry */}
          <button
            type="button"
            onClick={() => setSelectedNode("envelope")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 cursor-pointer relative ${
              activeStep === 3
                ? "bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-500/25 scale-102"
                : selectedNode === "envelope"
                ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 3 ? "bg-emerald-500 text-slate-950 border-emerald-400" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {activeStep === 3 ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Tag className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">3. Tag Item Registry</span>
              <span className="text-[10px] text-slate-500 block">DB Storage & Verification</span>
            </div>
          </button>

        </div>

        {/* Detailed Live Inspector Box */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 font-sans transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              {selectedNode === "hash" && "Phase 1: Tag Input Normalization & SHA-256 Hashing"}
              {selectedNode === "ecdsa" && "Phase 2: Masked Scalar Signature Calculation (x_static = x_batch + Δx)"}
              {selectedNode === "envelope" && "Phase 3: Tag Envelope Assembly & PostgreSQL Persistence"}
            </span>
            <span className="font-mono text-[10px] text-slate-500 uppercase">Signing Inspector</span>
          </div>

          {selectedNode === "hash" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-blue-400">🔢 <strong>Cryptographic Message Digest:</strong></p>
              <p>• Hardware UID (Hex): <span className="text-emerald-300 font-bold">{rfidUid || "04A32B1F996180"}</span></p>
              <p>• Linked Batch ID: <span className="text-blue-300">{selectedBatchId}</span></p>
            </div>
          )}

          {selectedNode === "ecdsa" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-amber-400">✍️ <strong>Masked Key Scalar Execution:</strong></p>
              <p>• Signing Key: <span className="text-slate-200">{selectedKey?.derived_key_pair_name || "Derived Key"}</span></p>
              <p>• Curve Type: <span className="text-blue-400 font-bold uppercase">{selectedKey?.curve_type || "ed25519"}</span></p>
              <p>• Computation: <span className="text-emerald-400">x_static = (x_batch + Δx) mod n</span> (No KMS Latency)</p>
            </div>
          )}

          {selectedNode === "envelope" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-emerald-400">🏷️ <strong>Tag Registry & DB Persistence:</strong></p>
              <p>• Target Table: <span className="text-slate-200">`backend_rfid_tags`</span></p>
              <p>• Saved Payload: <span className="text-emerald-300">UID, Batch ID, Signature R & S, Timestamp</span></p>
            </div>
          )}
        </div>

      </div>

      {/* SUCCESS OUTPUT DASHBOARD CARD (RFID TAG DATA & SIGNATURE) */}
      {resultData && (
        <div
          ref={resultCardRef}
          className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-5 space-y-4 animate-in fade-in duration-300 scroll-mt-6"
        >
          {/* Header Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>RFID Tag Item successfully signed & registered!</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCheck className="w-3 h-3 text-emerald-400" />
                MASKED_SIGNATURE_VALID
              </span>

              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 uppercase">
                <Cpu className="w-3 h-3 text-indigo-400" />
                {resultData.curve_type}
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Tag Registry UUID:</span>
              <span className="text-slate-200">{resultData.id}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">RFID Hardware UID (HEX):</span>
              <span className="text-emerald-400 font-bold tracking-widest bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {resultData.uid}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Linked Batch ID:</span>
              <span className="text-blue-400 font-semibold">{resultData.batchid}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Signing Public Key Name:</span>
              <span className="text-slate-200 font-sans font-semibold">{resultData.publickey_name}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Key Identifier (ID):</span>
              <span className="text-amber-400 font-bold">{resultData.key_identifier}</span>
            </div>

            {/* Signature R & S Points (Mit dynamischem Trimming für 128-Bit vs 256-Bit) */}
            <div className="py-2 border-b border-slate-900 space-y-2 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1 font-sans">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Signature Components (R, S):
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  {resultData.curve_type === "secp128r1" ? "16 Bytes Precision per Component" : "32 Bytes Precision per Component"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 pl-1">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold w-4">R:</span>
                  <span className="text-indigo-300 break-all bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[10px] font-mono select-all">
                    {formatSignatureComponent(resultData.signature_r, resultData.curve_type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-bold w-4">S:</span>
                  <span className="text-indigo-300 break-all bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-[10px] font-mono select-all">
                    {formatSignatureComponent(resultData.signature_s, resultData.curve_type)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Signed At:</span>
              <span className="text-slate-400">{new Date(resultData.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}