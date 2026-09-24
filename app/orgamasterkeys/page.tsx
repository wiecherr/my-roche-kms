"use client";

import { useState, useEffect, useRef } from "react";
import { 
  KeyRound, 
  ShieldCheck, 
  Building2, 
  Tag, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Cloud,
  Database,
  ArrowRight,
  Code2,
  Play,
  Info,
  Send,
  Sparkles,
  GitCommit
} from "lucide-react";

export default function KMSSetupPage() {
  // REFS FÜR DIE GEZIELTE SCROLL-STEUERUNG
  const pipelineRef = useRef<HTMLDivElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [orgaName, setOrgaName] = useState("");
  const [aliasInput, setAliasInput] = useState("");
  const [curveType, setCurveType] = useState<"ed25519" | "secp256r1" | "secp128r1">("ed25519");
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Interactive State: Which node is currently focused/clicked?
  const [selectedNode, setSelectedNode] = useState<"admin" | "aws" | "db">("admin");
  const [showLiveJson, setShowLiveJson] = useState<boolean>(false);

  const [resultData, setResultData] = useState<{
    id: string;
    organization_name: string;
    kmskeyarn: string;
    alias: string;
    curve_type: string;
    created_at: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. SCROLLEN ZU DEN 3 STEPS, SOBALD DIE PIPELINE STARTET
  useEffect(() => {
    if (activeStep === 1 && pipelineRef.current) {
      pipelineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeStep]);

  // 2. SCROLLEN ZUM ERGEBNIS-FELD, WENN BEENDET
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

  // 3. FOKUS UND SCROLLEN BEI FEHLER
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      errorRef.current.focus();
    }
  }, [error]);

  // Real Submit Process
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResultData(null);
    
    // Step 1: HQ Admin
    setActiveStep(1);
    setSelectedNode("admin");
    setStatusMessage("1/3 HQ Admin: Constructing REST payload with curve type...");

    try {
      await new Promise((r) => setTimeout(r, 1200));

      // Step 2: AWS KMS Provisioning
      setActiveStep(2);
      setSelectedNode("aws");
      setStatusMessage(`2/3 AWS KMS: Generating ${curveType.toUpperCase()} Root Key & Alias...`);

      const res = await fetch("http://localhost:3010/create-aws-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_name: orgaName,
          alias: aliasInput,
          curve_type: curveType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error generating key pair");
      }

      const data = await res.json();
      
      // Step 3: DB Registration
      setActiveStep(3);
      setSelectedNode("db");
      setStatusMessage("3/3 PostgreSQL: Registering Key ARN & Curve metadata...");
      await new Promise((r) => setTimeout(r, 800));

      // Finished
      setActiveStep(4);
      setResultData({
        ...data,
        curve_type: curveType // Fallback if backend doesn't return it directly in root
      });
      setStatusMessage(null);
    } catch (err: unknown) {
      setActiveStep(0);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Interactive Demo Run
  const handleSimulate = async () => {
    setIsLoading(true);
    setError(null);
    setResultData(null);
    const demoOrga = orgaName || "Demo Pharma Global";
    const demoAlias = aliasInput || "demo-master-key";

    // Stage 1: HQ Admin
    setActiveStep(1);
    setSelectedNode("admin");
    setStatusMessage("[DEMO 1/3] HQ Admin: Preparing REST payload with curve parameter...");
    await new Promise((r) => setTimeout(r, 1800));

    // Stage 2: AWS Cloud KMS
    setActiveStep(2);
    setSelectedNode("aws");
    setStatusMessage(`[DEMO 2/3] AWS KMS: Provisioning ${curveType.toUpperCase()} CMK...`);
    await new Promise((r) => setTimeout(r, 1800));

    // Stage 3: PostgreSQL Database
    setActiveStep(3);
    setSelectedNode("db");
    setStatusMessage("[DEMO 3/3] PostgreSQL: Persisting Key ARN & Curve metadata...");
    await new Promise((r) => setTimeout(r, 1200));

    // Stage 4: Successfully Completed
    setActiveStep(4);
    setResultData({
      id: "550e8400-e29b-41d4-a716-446655440000",
      organization_name: demoOrga,
      alias: demoAlias,
      curve_type: curveType,
      kmskeyarn: `arn:aws:kms:eu-north-1:123456789012:key/m-demo-${Math.random().toString(36).substring(7)}`,
      created_at: new Date().toISOString(),
    });
    setStatusMessage(null);
    setIsLoading(false);
  };

  return (
    <div className="w-full flex flex-col items-center py-4 space-y-6">
      {/* Main Form Card */}
      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">AWS KMS Master Key Provisioning</h1>
              <p className="text-xs text-slate-400">Create a new Cloud Root Key for an Organizational Unit</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLiveJson(!showLiveJson)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-indigo-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showLiveJson ? "Form View" : "Live Payload"}</span>
          </button>
        </div>

        {/* Live Payload Preview Toggle */}
        {showLiveJson ? (
          <div className="space-y-3">
            <span className="text-xs font-mono text-slate-400 block uppercase">Realtime API JSON Payload:</span>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto select-all">
              {JSON.stringify(
                {
                  endpoint: "POST /create-aws-key",
                  headers: { "Content-Type": "application/json" },
                  body: {
                    organization_name: orgaName || "<Pending Input>",
                    alias: aliasInput ? `alias/${aliasInput}` : "alias/<Pending Input>",
                    curve_type: curveType,
                  },
                },
                null,
                2
              )}
            </pre>
            <button
              type="button"
              onClick={() => setShowLiveJson(false)}
              className="text-xs text-blue-400 hover:underline font-mono"
            >
              ← Back to Form Inputs
            </button>
          </div>
        ) : (
          /* Form Inputs */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Organization Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Roche Pharma AG"
                value={orgaName}
                onChange={(e) => setOrgaName(e.target.value)}
                disabled={isLoading}
                className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  AWS Key Alias
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. roche-master-key"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all pl-16 disabled:opacity-50"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-slate-500 font-mono select-none">
                    alias/
                  </span>
                </div>
              </div>

              {/* NEUES AUSWAHLFELD: CURVE TYPE */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-emerald-400" />
                  Cryptographic Curve Type
                </label>
                <select
                  value={curveType}
                  onChange={(e) => setCurveType(e.target.value as "ed25519" | "secp256r1" | "secp128r1")}
                  disabled={isLoading}
                  className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="ed25519">Ed25519 (ECC_NIST_EDWARDS25519 - SIGN_VERIFY)</option>
                  <option value="secp256r1">secp256r1 (ECC_NIST_P256 - SIGN_VERIFY)</option>
                  <option value="secp128r1">secp128r1 (SYMMETRIC_DEFAULT - ENCRYPT_DECRYPT)</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Selects the hardware key spec and usage type dynamically provisioned in AWS KMS.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="sm:col-span-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{statusMessage}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Generate & Provision AWS Key</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSimulate}
                disabled={isLoading}
                title="Simulate process as an interactive demo without sending API requests"
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-semibold py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Demo Run</span>
              </button>
            </div>
          </form>
        )}

        {/* Error Notification */}
        {error && (
          <div 
            ref={errorRef}
            tabIndex={-1}
            className="mt-6 p-4 bg-red-950/40 border border-red-800/50 rounded-xl flex items-start gap-3 text-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 scroll-mt-6"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Key Provisioning Failed</p>
              <p className="text-xs text-red-400/80 mt-1">{error}</p>
            </div>
          </div>
        )}

      </div>

      {/* PROCESS VISUALIZATION FLOW */}
      <div 
        ref={pipelineRef}
        className="w-full max-w-2xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 font-mono scroll-mt-6"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 font-sans">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Interactive KMS Provisioning Flow
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeStep === 0 && "Status: Standby"}
            {activeStep === 1 && "Status: [1/3] Preparing Request @ HQ Admin..."}
            {activeStep === 2 && "Status: [2/3] Provisioning @ AWS KMS..."}
            {activeStep === 3 && "Status: [3/3] Registering Metadata @ DB..."}
            {activeStep === 4 && "Status: Provisioning Complete"}
          </span>
        </div>

        {/* Clickable Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs relative">
          
          {/* Node 1: Local / HQ Admin */}
          <button
            type="button"
            onClick={() => setSelectedNode("admin")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 relative cursor-pointer ${
              activeStep === 1
                ? "bg-slate-900 border-blue-400 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/25 scale-102"
                : selectedNode === "admin"
                ? "bg-slate-900 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 1 ? "bg-blue-500 text-white border-blue-400 animate-pulse" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            }`}>
              {activeStep === 1 ? <Send className="w-5 h-5 animate-bounce" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">1. HQ Admin</span>
              <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">
                {orgaName || "HTTP REST Payload"}
              </span>
            </div>
          </button>

          {/* Path 1 -> 2 Arrow Indicator */}
          <div className="hidden sm:flex absolute left-[31%] top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <ArrowRight className={`w-4 h-4 transition-colors ${
              activeStep >= 1 ? "text-blue-400 animate-pulse" : "text-slate-700"
            }`} />
          </div>

          {/* Node 2: AWS Cloud KMS */}
          <button
            type="button"
            onClick={() => setSelectedNode("aws")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 relative cursor-pointer ${
              activeStep === 2
                ? "bg-slate-900 border-amber-400 ring-2 ring-amber-500/50 shadow-xl shadow-amber-500/25 scale-102"
                : selectedNode === "aws"
                ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 2 ? "bg-amber-500 text-slate-950 border-amber-400" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {activeStep === 2 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">2. AWS KMS</span>
              <span className="text-[10px] text-amber-400 block font-bold">{curveType.toUpperCase()}</span>
            </div>
          </button>

          {/* Path 2 -> 3 Arrow Indicator */}
          <div className="hidden sm:flex absolute left-[65%] top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <ArrowRight className={`w-4 h-4 transition-colors ${
              activeStep >= 2 ? "text-indigo-400 animate-pulse" : "text-slate-700"
            }`} />
          </div>

          {/* Node 3: PostgreSQL Database */}
          <button
            type="button"
            onClick={() => setSelectedNode("db")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 cursor-pointer relative ${
              activeStep === 3
                ? "bg-slate-900 border-indigo-400 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/25 scale-102"
                : selectedNode === "db"
                ? "bg-slate-900 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 3 ? "bg-indigo-500 text-white border-indigo-400" : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            }`}>
              {activeStep === 3 ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">3. PostgreSQL</span>
              <span className="text-[10px] text-slate-500 block">Metadata & PubKey</span>
            </div>
          </button>

        </div>

        {/* Detailed Live Inspection Box */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 font-sans transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              {selectedNode === "admin" && "Node 1: Next.js Frontend ➔ Go REST API Request"}
              {selectedNode === "aws" && "Node 2: AWS KMS SDK (`kms:CreateKey` / `kms:GetPublicKey`)"}
              {selectedNode === "db" && "Node 3: PostgreSQL Multi-Tenant Storage"}
            </span>
            <span className="font-mono text-[10px] text-slate-500 uppercase">Live Inspector</span>
          </div>

          {selectedNode === "admin" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-blue-400">📤 <strong>Request parameters:</strong></p>
              <p>• Organization: <span className="text-slate-200">{orgaName || "(Not specified)"}</span></p>
              <p>• Alias Target: <span className="text-indigo-300">alias/{aliasInput || "..."}</span></p>
              <p>• Selected Curve: <span className="text-emerald-400 font-bold">{curveType}</span></p>
            </div>
          )}

          {selectedNode === "aws" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-amber-400">🛡️ <strong>AWS KMS Execution Profile:</strong></p>
              {curveType === "ed25519" && (
                <p>• KeySpec: <span className="text-amber-300">ECC_NIST_EDWARDS25519</span> | Usage: <span className="text-emerald-300">SIGN_VERIFY</span></p>
              )}
              {curveType === "secp256r1" && (
                <p>• KeySpec: <span className="text-amber-300">ECC_NIST_P256</span> | Usage: <span className="text-emerald-300">SIGN_VERIFY</span></p>
              )}
              {curveType === "secp128r1" && (
                <p>• KeySpec: <span className="text-amber-300">SYMMETRIC_DEFAULT</span> | Usage: <span className="text-emerald-300">ENCRYPT_DECRYPT</span></p>
              )}
              <p>• Action: Provision hardware key and extract static Root Public Key $P_{"{master}"}$.</p>
            </div>
          )}

          {selectedNode === "db" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-indigo-400">💾 <strong>PostgreSQL Table: `hsm_organizational_aws_master_keys`</strong></p>
              <p>Persists `id`, `organization_name`, `alias`, `kmskeyarn`, `curve_type`, `public_key_static_x`, and `public_key_static_y`.</p>
            </div>
          )}
        </div>

      </div>

      {/* SUCCESS OUTPUT DASHBOARD CARD */}
      {resultData && (
        <div
          ref={resultCardRef}
          className="w-full max-w-2xl bg-slate-950/90 border border-emerald-500/30 rounded-xl p-5 space-y-3 animate-in fade-in duration-300 scroll-mt-6"
        >
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>AWS Master Key & Root Public Key successfully registered!</span>
          </div>
          
          <div className="space-y-2 text-xs font-mono pt-2 border-t border-slate-800">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">DB UUID:</span>
              <span className="text-slate-200">{resultData.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Organization:</span>
              <span className="text-slate-200 font-sans font-semibold">{resultData.organization_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Curve Type:</span>
              <span className="text-emerald-400 font-bold uppercase">{resultData.curve_type || curveType}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Alias:</span>
              <span className="text-indigo-400">alias/{resultData.alias}</span>
            </div>
            <div className="flex flex-col gap-1 py-1 border-b border-slate-900">
              <span className="text-slate-500">AWS KMS Key ARN:</span>
              <span className="text-blue-400 break-all bg-slate-900 p-2 rounded border border-slate-800">{resultData.kmskeyarn}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Created At:</span>
              <span className="text-slate-400">{new Date(resultData.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}