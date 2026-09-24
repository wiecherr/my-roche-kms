"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Server, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Globe, 
  Search, 
  ShieldCheck, 
  Key, 
  Tag, 
  ArrowRight,
  Sparkles,
  Database,
  Zap,
  Radio,
  Clock,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Building2,
  Hash,
  Sliders,
  PlusCircle,
  X
} from "lucide-react";

interface BlobEvent {
  id: string;
  plant_id: string;
  plant_name?: string;
  curve_type: string;
  derived_key_id: string;
  p_master_x: string;
  p_master_y: string;
  prod_master_key_plain?: string;
  x_delta_raw?: string;
  received_at: string;
  region: string;
}

interface TagEvent {
  uid: string;
  batch_id: string;
  sig_r: string;
  sig_s: string;
  curve_type: string;
  derived_key_id: string;
  generated_at: string;
}

const AVAILABLE_REGIONS = [
  { id: "eu-north-1", label: "EU North (Stockholm)" },
  { id: "eu-west-1", label: "EU West (Ireland)" },
  { id: "us-east-1", label: "US East (N. Virginia)" },
  { id: "ap-south-1", label: "APAC (Mumbai)" },
  { id: "sa-east-1", label: "LATAM (São Paulo)" },
];

const HARDCODED_BATCHES = [
  { batch_id: "BATCH-2026-001", fluid_type: "Reagent-A-High-Purity" },
  { batch_id: "BATCH-2026-002", fluid_type: "Reagent-B-Standard-Buffer" },
  { batch_id: "BATCH-2026-003", fluid_type: "Reagent-C-Enzyme-Sol" },
  { batch_id: "BATCH-TEST-DEV", fluid_type: "Water-Validation-Dummy" },
];

// Erzeugt eine zufällige 7-Byte Hex-UID (z. B. "04A1F38C9B12E0")
const generateRandomHexUID = (): string => {
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join("");
};

export default function KMSSimulatorPage() {
  const [prodRegion, setProdRegion] = useState<string>("eu-north-1");
  const [custRegion, setCustRegion] = useState<string>("eu-north-1");

  const [prodSearch, setProdSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [custSearch, setCustSearch] = useState("");

  const [prodBlobs, setProdBlobs] = useState<BlobEvent[]>([]);
  const [signedTags, setSignedTags] = useState<TagEvent[]>([]);
  const [customerBlobs, setCustomerBlobs] = useState<BlobEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNewIngress, setHasNewIngress] = useState(false);

  const [expandedBlobId, setExpandedBlobId] = useState<string | null>(null);
  const [expandedTagKey, setExpandedTagKey] = useState<string | null>(null);
  const [expandedCustKey, setExpandedCustKey] = useState<string | null>(null);
  const prevProdCount = useRef<number>(0);

  const [selectedTag, setSelectedTag] = useState<TagEvent | null>(null);
  const [selectedPMaster, setSelectedPMaster] = useState<BlobEvent | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: "idle" | "success" | "failed";
    message: string;
  }>({ status: "idle", message: "" });

  // State für die manuelle Tag-Erstellung
  const [selectedBlobForTag, setSelectedBlobForTag] = useState<BlobEvent | null>(null);
  const [manualUID, setManualUID] = useState(generateRandomHexUID());
  const [manualBatchID, setManualBatchID] = useState(HARDCODED_BATCHES[0].batch_id);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchState = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await fetch(`http://localhost:3010/kms-live-state?prod_region=${prodRegion}&cust_region=${custRegion}`);
      if (res.ok) {
        const data = await res.json();
        const newProdBlobs: BlobEvent[] = data.prod_blobs || [];

        if (prevProdCount.current > 0 && newProdBlobs.length > prevProdCount.current) {
          setHasNewIngress(true);
          setTimeout(() => setHasNewIngress(false), 4000);
        }
        prevProdCount.current = newProdBlobs.length;

        setProdBlobs(newProdBlobs);
        setSignedTags(data.signed_tags || []);
        setCustomerBlobs(data.customer_blobs || []);
      }
    } catch (e) {
      console.error("Error fetching simulator state:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleRegionSwitch = async (target: "prod" | "cust", region: string) => {
    if (target === "prod") setProdRegion(region);
    if (target === "cust") setCustRegion(region);

    try {
      await fetch("http://localhost:3010/switch-region", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, region }),
      });
      await fetchState(false);
    } catch (err) {
      console.error("Failed to switch region in Go backend:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadInitialState = async () => {
      await fetchState(false);
    };

    loadInitialState();

    const interval = setInterval(() => {
      if (isMounted) {
        fetchState(false);
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [prodRegion, custRegion]);

  const filteredProdBlobs = useMemo(() => {
    return prodBlobs.filter(b => {
      const search = prodSearch.toLowerCase();
      return (
        (b.derived_key_id && b.derived_key_id.toLowerCase().includes(search)) ||
        (b.curve_type && b.curve_type.toLowerCase().includes(search)) ||
        (b.plant_id && b.plant_id.toLowerCase().includes(search)) ||
        (b.plant_name && b.plant_name.toLowerCase().includes(search))
      );
    });
  }, [prodBlobs, prodSearch]);

  const filteredTags = useMemo(() => {
    return signedTags.filter(t => 
      t.uid.toLowerCase().includes(tagSearch.toLowerCase()) ||
      t.batch_id.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [signedTags, tagSearch]);

  const filteredCustBlobs = useMemo(() => {
    return customerBlobs.filter(b => 
      (b.derived_key_id && b.derived_key_id.toLowerCase().includes(custSearch.toLowerCase())) ||
      (b.curve_type && b.curve_type.toLowerCase().includes(custSearch.toLowerCase())) ||
      (b.p_master_x && b.p_master_x.toLowerCase().includes(custSearch.toLowerCase()))
    );
  }, [customerBlobs, custSearch]);

  const handleVerify = async () => {
    if (!selectedTag || !selectedPMaster) return;

    setVerifying(true);
    setVerificationResult({ status: "idle", message: "" });

    try {
      const res = await fetch("http://localhost:3010/verify-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfid_uid: selectedTag.uid,
          batch_id: selectedTag.batch_id,
          pub_key_x: selectedPMaster.p_master_x,
          pub_key_y: selectedPMaster.p_master_y,
          signature_r: selectedTag.sig_r,
          signature_s: selectedTag.sig_s,
          curve_type: selectedTag.curve_type,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (res.ok && data.success) {
          setVerificationResult({
            status: "success",
            message: "Signature MATCH! Offline verification successful against P_master anchor.",
          });
        } else {
          setVerificationResult({
            status: "failed",
            message: "Verification MISMATCH! Signature does not belong to selected P_master anchor.",
          });
        }
      } else {
        setVerificationResult({
          status: "failed",
          message: "Cryptographic validation failed or returned error.",
        });
      }
    } catch (err) {
      setVerificationResult({
        status: "failed",
        message: "Server communication error during verification.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateTagSubmit = async () => {
    if (!selectedBlobForTag) return;
    setIsGenerating(true);

    try {
      const res = await fetch("http://localhost:3010/generate-manual-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plant_id: selectedBlobForTag.plant_id,
          id: selectedBlobForTag.id || selectedBlobForTag.derived_key_id,
          uid: manualUID,
          batch_id: manualBatchID,
        }),
      });

      if (res.ok) {
        await fetchState(false);
        setSelectedBlobForTag(null);
      } else {
        const errData = await res.json();
        alert("Tag Generation Error: " + (errData.error || "Failed to create tag"));
      }
    } catch (err) {
      console.error("Network error creating manual tag:", err);
      alert("Server communication error while generating tag.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAccordion = (id: string) => {
    setExpandedBlobId(prev => (prev === id ? null : id));
  };

  const toggleTagAccordion = (key: string) => {
    setExpandedTagKey(prev => (prev === key ? null : key));
  };

  const toggleCustAccordion = (key: string) => {
    setExpandedCustKey(prev => (prev === key ? null : key));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6 h-screen flex flex-col overflow-hidden">
      
      {/* FIXED TOP SECTION */}
      <div className="shrink-0 space-y-4">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Live KMS Simulator &amp; Verification Workbench
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              End-to-End Simulation: S3 Production Ingress Blobs &rarr; Tag Signing &rarr; Customer P<sub>master</sub> Offline Verification
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
              <span>Live Polling (2s)</span>
            </div>

            <button 
              onClick={() => fetchState(true)}
              className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-500/50 transition-all text-zinc-700 dark:text-zinc-300 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${loading ? "animate-spin" : ""}`} />
              Sync State
            </button>
          </div>
        </header>

        {/* Modal/Formular für manuelle Tag-Erstellung */}
        {selectedBlobForTag && (
          <section className="p-4 border border-indigo-500/40 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3 font-mono text-xs shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center font-bold text-indigo-600 dark:text-indigo-400">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-500" />
                <span>Sign RFID Tag from Plant: {selectedBlobForTag.plant_name || selectedBlobForTag.plant_id} ({selectedBlobForTag.derived_key_id})</span>
              </div>
              <button 
                onClick={() => setSelectedBlobForTag(null)} 
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-zinc-500 font-bold">HEX UID:</label>
                  <button
                    type="button"
                    onClick={() => setManualUID(generateRandomHexUID())}
                    className="text-[10px] text-indigo-500 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    🎲 Randomize
                  </button>
                </div>
                <input
                  type="text"
                  value={manualUID}
                  onChange={(e) => setManualUID(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-500 mb-1 font-bold">Batch ID:</label>
                <select
                  value={manualBatchID}
                  onChange={(e) => setManualBatchID(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {HARDCODED_BATCHES.map((b) => (
                    <option key={b.batch_id} value={b.batch_id}>
                      {b.batch_id} ({b.fluid_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setSelectedBlobForTag(null)}
                className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTagSubmit}
                disabled={isGenerating}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing ECDSA...</span>
                  </>
                ) : (
                  <>
                    <Tag className="w-3.5 h-3.5" />
                    <span>Generate &amp; Add Tag</span>
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Verification Console */}
        <section className="p-4 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm transition-all space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Interactive Verification Console</span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              {selectedTag && selectedPMaster ? "● Ready to Verify" : "Awaiting Selection..."}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
              {selectedTag ? (
                <div className="space-y-1 font-mono text-xs w-full">
                  <div className="flex justify-between items-center text-indigo-500 font-bold">
                    <span>Selected Tag: {selectedTag.uid}</span>
                    <span className="text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{selectedTag.curve_type}</span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate">Batch: {selectedTag.batch_id}</div>
                  <div className="text-zinc-400 dark:text-zinc-500 text-[10px] truncate">SigR: {selectedTag.sig_r}</div>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-2 italic">
                  <Tag className="w-4 h-4 opacity-50" />
                  Select a signed tag from the middle column...
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex justify-center">
              <button
                onClick={handleVerify}
                disabled={!selectedTag || !selectedPMaster || verifying}
                className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                  selectedTag && selectedPMaster && !verifying
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-500/20"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                }`}
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <span>Verify ECDSA</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="md:col-span-5 p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
              {selectedPMaster ? (
                <div className="space-y-1 font-mono text-xs w-full">
                  <div className="flex justify-between items-center text-purple-500 font-bold">
                    <span>P_master Anchor: {selectedPMaster.derived_key_id}</span>
                    <span className="text-[10px] bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{selectedPMaster.curve_type}</span>
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate">Plant: {selectedPMaster.plant_name || selectedPMaster.plant_id}</div>
                  <div className="text-zinc-400 dark:text-zinc-500 text-[10px] truncate">PubX: {selectedPMaster.p_master_x}</div>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-2 italic">
                  <Key className="w-4 h-4 opacity-50" />
                  Select a P_master anchor from the right column...
                </div>
              )}
            </div>
          </div>

          {verificationResult.status !== "idle" && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-3 border font-mono animate-in fade-in slide-in-from-top-2 ${
              verificationResult.status === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}>
              {verificationResult.status === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <div className="space-y-0.5">
                <div className="font-bold">{verificationResult.status === "success" ? "OFFLINE VERIFICATION SUCCESSFUL" : "VERIFICATION FAILED"}</div>
                <div>{verificationResult.message}</div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 3-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* COLUMN 1: PRODUCTION BLOBS */}
        <div className={`flex flex-col p-4 border rounded-2xl bg-white dark:bg-zinc-950 shadow-xs h-full min-h-0 transition-all duration-500 ${
          hasNewIngress ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-zinc-200 dark:border-zinc-800"
        }`}>
          
          <div className="space-y-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Server className="w-4 h-4" />
                <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Production S3 Ingress</h2>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {filteredProdBlobs.length} Blobs
              </span>
            </div>

            <div className="flex flex-col gap-1.5 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="text-zinc-500 font-mono text-[11px] flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-500" /> Target Ingress Region:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {AVAILABLE_REGIONS.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => handleRegionSwitch("prod", reg.id)}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] transition-all cursor-pointer text-center truncate ${
                      prodRegion === reg.id
                        ? "bg-emerald-500 text-white font-semibold shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-white dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50"
                    }`}
                  >
                    {reg.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter production blobs..."
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          {/* Scrollable Production Cards */}
          <div className="space-y-3 overflow-y-auto pr-1 flex-1 mt-3">
            {filteredProdBlobs.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 dark:text-zinc-600 text-xs italic font-mono">
                No production S3 blobs found in {prodRegion}.
              </div>
            ) : (
              filteredProdBlobs.map((blob, idx) => {
                const cardId = `${blob.plant_id || "plant"}-${blob.id || blob.derived_key_id || "blob"}-${idx}`;
                const isExpanded = expandedBlobId === cardId;
                
                return (
                  <div
                    key={cardId}
                    className={`p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border rounded-xl space-y-2.5 font-mono text-xs transition-all relative ${
                      idx === 0 
                        ? "border-emerald-500/50 shadow-xs dark:bg-zinc-900/90" 
                        : "border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/40"
                    }`}
                  >
                    {/* Header: Plant Name & Key ID */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-500" />
                          <span>{blob.plant_name || blob.plant_id || "Production Plant"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <Key className="w-3 h-3 text-zinc-400" />
                          <span>Key ID: {blob.derived_key_id}</span>
                        </div>
                      </div>

                      {idx === 0 && (
                        <span className="flex items-center gap-1 text-[9px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse shrink-0">
                          <Zap className="w-2.5 h-2.5" /> NEW INGRESS
                        </span>
                      )}
                    </div>

                    {/* Metadata Pill Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
                        {blob.curve_type || "secp256r1"}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
                        {blob.region || prodRegion}
                      </span>
                    </div>

                    {/* Button: Manuelle Tag-Generierung auslösen */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlobForTag(blob);
                        setManualUID(generateRandomHexUID()); // Frische UID beim Öffnen
                      }}
                      className="w-full py-1.5 px-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:text-indigo-400 dark:hover:text-white rounded-lg font-mono text-[11px] font-bold transition-all border border-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Sign Manual Tag</span>
                    </button>

                    {/* Timestamp Info */}
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 pt-1 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      <span>Arrived: {blob.received_at ? new Date(blob.received_at).toLocaleTimeString() : "Just now"}</span>
                    </div>

                    {/* Public Key Anchors Grid */}
                    <div className="bg-zinc-100 dark:bg-zinc-950/80 p-2 rounded-lg space-y-1 text-[10px] border border-zinc-200/50 dark:border-zinc-800/50">
                      <div className="text-zinc-500 truncate"><span className="text-zinc-400">P_X:</span> {blob.p_master_x}</div>
                      <div className="text-zinc-500 truncate"><span className="text-zinc-400">P_Y:</span> {blob.p_master_y}</div>
                    </div>

                    {/* Cryptographic Secrets & Offset Box */}
                    <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-2.5 rounded-lg space-y-1.5 text-[10px] border border-emerald-500/20">
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span>prod_master_key_plain (x_batch)</span>
                        </span>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-300 font-mono truncate bg-white dark:bg-zinc-900 p-1 rounded border border-zinc-200 dark:border-zinc-800">
                        {blob.prod_master_key_plain || "0x00000000000000000000000000000000"}
                      </div>

                      <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-bold pt-1">
                        <span className="flex items-center gap-1">
                          <Sliders className="w-3 h-3" />
                          <span>x_delta_raw (&Delta;x Offset)</span>
                        </span>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-300 font-mono truncate bg-white dark:bg-zinc-900 p-1 rounded border border-zinc-200 dark:border-zinc-800">
                        {blob.x_delta_raw || "0x00000000000000000000000000000000"}
                      </div>
                    </div>

                    {/* Expandable Accordion for Payload Details */}
                    <button
                      onClick={() => toggleAccordion(cardId)}
                      className="w-full pt-1 text-[10px] text-zinc-500 hover:text-emerald-500 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1 font-semibold">
                        <FileCode2 className="w-3 h-3" />
                        {isExpanded ? "Hide Payload Raw Data" : "Inspect Payload Raw Details"}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <div className="p-2 bg-zinc-950 text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto border border-emerald-500/30 animate-in fade-in slide-in-from-top-1">
                        <pre>{JSON.stringify({
                          plant_name: blob.plant_name,
                          plant_id: blob.plant_id,
                          derived_key_id: blob.derived_key_id,
                          curve_type: blob.curve_type,
                          region: blob.region,
                          p_master_x: blob.p_master_x,
                          p_master_y: blob.p_master_y,
                          prod_master_key_plain: blob.prod_master_key_plain,
                          x_delta_raw: blob.x_delta_raw,
                          received_at: blob.received_at
                        }, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: SIGNED RFID TAGS */}
        <div className="flex flex-col p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-xs h-full min-h-0 space-y-4">
          <div className="space-y-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-4 h-4" />
                <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Signed RFID Tags</h2>
              </div>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                {filteredTags.length} Tags
              </span>
            </div>

            <div className="p-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[11px] text-zinc-500 dark:text-zinc-400">
              Click a tag to select it for offline verification against P<sub>master</sub>.
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter by UID or BatchID..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
            {filteredTags.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 dark:text-zinc-600 text-xs italic font-mono">
                No signed RFID tags available in memory.
              </div>
            ) : (
              filteredTags.map((t, idx) => {
                const tagKey = `${t.uid}-${t.batch_id}-${idx}`;
                const isSelected = selectedTag?.uid === t.uid && selectedTag?.batch_id === t.batch_id;
                const isExpanded = expandedTagKey === tagKey;
                
                return (
                  <div
                    key={tagKey}
                    onClick={() => setSelectedTag(t)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border font-mono text-xs space-y-2 relative overflow-hidden ${
                      isSelected
                        ? "bg-indigo-500/10 border-indigo-500 text-zinc-900 dark:text-zinc-50 shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80 hover:border-indigo-500/40"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
                    )}
                    
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-500" />
                        <span>UID: {t.uid}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold">
                        {t.curve_type || "secp256r1"}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Batch:</span> {t.batch_id}
                    </div>

                    {/* Compact Signature Summary */}
                    <div className="bg-zinc-100 dark:bg-zinc-950/80 p-2 rounded-lg space-y-1 text-[10px] border border-zinc-200/50 dark:border-zinc-800/50">
                      <div className="text-zinc-500 truncate">
                        <span className="text-indigo-500 font-semibold">SigR:</span> {t.sig_r}
                      </div>
                      <div className="text-zinc-500 truncate">
                        <span className="text-indigo-500 font-semibold">SigS:</span> {t.sig_s}
                      </div>
                    </div>

                    {/* Expandable Accordion for Full Tag Details */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Verhindert Auswählen beim Aufklappen
                        toggleTagAccordion(tagKey);
                      }}
                      className="w-full pt-1 text-[10px] text-zinc-500 hover:text-indigo-500 flex items-center justify-between transition-colors cursor-pointer border-t border-zinc-200/60 dark:border-zinc-800/60"
                    >
                      <span className="flex items-center gap-1 font-semibold">
                        <FileCode2 className="w-3 h-3" />
                        {isExpanded ? "Hide Signature Raw Details" : "Inspect Signature Details"}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <div className="p-2.5 bg-zinc-950 text-indigo-300 rounded-lg text-[10px] font-mono space-y-2 border border-indigo-500/30 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-1">
                          <div className="text-zinc-400 font-bold">Signature Component R (r):</div>
                          <div className="break-all bg-zinc-900 p-1.5 rounded border border-zinc-800 text-zinc-200">
                            {t.sig_r}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-zinc-400 font-bold">Signature Component S (s):</div>
                          <div className="break-all bg-zinc-900 p-1.5 rounded border border-zinc-800 text-zinc-200">
                            {t.sig_s}
                          </div>
                        </div>

                        <div className="pt-1 text-[9px] text-zinc-500 space-y-0.5 border-t border-zinc-900">
                          <div><span className="text-zinc-400">Derived Key ID:</span> {t.derived_key_id}</div>
                          <div><span className="text-zinc-400">Generated At:</span> {t.generated_at ? new Date(t.generated_at).toLocaleString() : "N/A"}</div>
                        </div>

                        <pre className="text-[9px] text-zinc-500 overflow-x-auto pt-1 border-t border-zinc-900">{JSON.stringify({
                          uid: t.uid,
                          batch_id: t.batch_id,
                          sig_r: t.sig_r,
                          sig_s: t.sig_s,
                          curve_type: t.curve_type,
                          derived_key_id: t.derived_key_id,
                          generated_at: t.generated_at
                        }, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: CUSTOMER P_MASTER BLOBS */}
        <div className="flex flex-col p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-xs h-full min-h-0 space-y-4">
          <div className="space-y-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Database className="w-4 h-4" />
                <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  Customer P<sub>master</sub> Anchors
                </h2>
              </div>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded-full">
                {filteredCustBlobs.length} Anchors
              </span>
            </div>

            <div className="flex flex-col gap-1.5 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="text-zinc-500 font-mono text-[11px] flex items-center gap-1">
                <Globe className="w-3 h-3 text-purple-500" /> Target Customer Region:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                {AVAILABLE_REGIONS.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => handleRegionSwitch("cust", reg.id)}
                    className={`px-2 py-1 rounded-lg font-mono text-[10px] transition-all cursor-pointer text-center truncate ${
                      custRegion === reg.id
                        ? "bg-purple-600 text-white font-semibold shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-white dark:bg-zinc-950/50 border border-zinc-200/50 dark:border-zinc-800/50"
                    }`}
                  >
                    {reg.id}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter P_master anchors..."
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
            {filteredCustBlobs.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 dark:text-zinc-600 text-xs italic font-mono">
                No P<sub>master</sub> anchors registered in {custRegion}.
              </div>
            ) : (
              filteredCustBlobs.map((blob, idx) => {
                const anchorKey = `${blob.plant_id || "cust"}-${blob.derived_key_id || blob.id || "anchor"}-${idx}`;
                
                const isSelected = 
                  selectedPMaster?.derived_key_id === blob.derived_key_id && 
                  selectedPMaster?.plant_id === blob.plant_id;

                const isExpanded = expandedCustKey === anchorKey;

                return (
                  <div
                    key={anchorKey}
                    onClick={() => setSelectedPMaster(blob)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border font-mono text-xs space-y-2 relative overflow-hidden ${
                      isSelected
                        ? "bg-purple-500/10 border-purple-500 text-zinc-900 dark:text-zinc-50 shadow-xs"
                        : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800/80 hover:border-purple-500/40"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0 right-0 w-2 h-full bg-purple-500" />
                    )}

                    {/* Header: Key ID, Region & Curve Type Badges */}
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-purple-600 dark:text-purple-400 truncate max-w-[140px]">
                        {blob.derived_key_id}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 font-bold">
                          {blob.curve_type || "secp256r1"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {blob.region || custRegion}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-500 truncate">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">Plant/Site:</span> {blob.plant_name || blob.plant_id || "Customer Site"}
                    </div>

                    {/* Compact Public Key Anchors */}
                    <div className="bg-zinc-100 dark:bg-zinc-950/80 p-2 rounded-lg space-y-1 text-[10px] border border-zinc-200/50 dark:border-zinc-800/50">
                      <div className="text-zinc-500 truncate"><span className="text-purple-500 font-semibold">PubX:</span> {blob.p_master_x}</div>
                      <div className="text-zinc-500 truncate"><span className="text-purple-500 font-semibold">PubY:</span> {blob.p_master_y}</div>
                    </div>

                    {/* Expandable Accordion for Full Anchor Details */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Verhindert Selektion beim Aufklappen
                        toggleCustAccordion(anchorKey);
                      }}
                      className="w-full pt-1 text-[10px] text-zinc-500 hover:text-purple-500 flex items-center justify-between transition-colors cursor-pointer border-t border-zinc-200/60 dark:border-zinc-800/60"
                    >
                      <span className="flex items-center gap-1 font-semibold">
                        <FileCode2 className="w-3 h-3" />
                        {isExpanded ? "Hide Anchor Details" : "Inspect Anchor Details"}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {isExpanded && (
                      <div className="p-2.5 bg-zinc-950 text-purple-300 rounded-lg text-[10px] font-mono space-y-2 border border-purple-500/30 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-1">
                          <div className="text-zinc-400 font-bold">Public Key Component X (P_master_X):</div>
                          <div className="break-all bg-zinc-900 p-1.5 rounded border border-zinc-800 text-zinc-200">
                            {blob.p_master_x}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-zinc-400 font-bold">Public Key Component Y (P_master_Y):</div>
                          <div className="break-all bg-zinc-900 p-1.5 rounded border border-zinc-800 text-zinc-200">
                            {blob.p_master_y}
                          </div>
                        </div>

                        <pre className="text-[9px] text-zinc-500 overflow-x-auto pt-1 border-t border-zinc-900">{JSON.stringify({
                          derived_key_id: blob.derived_key_id,
                          plant_id: blob.plant_id,
                          plant_name: blob.plant_name,
                          curve_type: blob.curve_type,
                          region: blob.region,
                          p_master_x: blob.p_master_x,
                          p_master_y: blob.p_master_y,
                          received_at: blob.received_at
                        }, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}