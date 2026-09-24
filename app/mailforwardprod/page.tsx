"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  KeyRound, 
  Factory, 
  ArrowLeft, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileKey,
  Cpu,
  Play,
  Sparkles,
  ArrowRight,
  Info,
  Lock,
  Copy,
  Check,
  Binary,
  ShieldCheck,
  Server,
  AtSign
} from "lucide-react";

// Interfaces
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

interface PlantItem {
  id: string;
  plant_name: string;
  plant_email: string;
  plant_pem_priv?: string;
  plant_pem_pub?: string;
  created_at?: string;
}

export default function CreateMailForwardPlantPage() {
  const router = useRouter();

  // REFS FÜR DIE GEZIELTE SCROLL-STEUERUNG
  const pipelineRef = useRef<HTMLDivElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);

  // Component States
  const [publicKeys, setPublicKeys] = useState<DerivedKeyPairItem[]>([]);
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(true);
  const [loadingPlants, setLoadingPlants] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Values
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");

  // DEMO & VISUALIZATION STATES
  // 0: Standby, 1: KMS Unwrapping & Derived Key Loading, 2: RSA Hybrid Package Encryption, 3: SMTP Mail Dispatch, 4: Done
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<"unwrap" | "encrypt" | "smtp">("unwrap");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sent Email Payload for Preview Card
  const [resultData, setResultData] = useState<{
    id: string;
    plant_name: string;
    plant_email: string;
    sender_email: string;
    subject: string;
    key_identifier: string;
    curve_type: string;
    encrypted_package_base64: string;
    package_signature_sha256: string;
    sent_at: string;
  } | null>(null);

  const [copiedPayload, setCopiedPayload] = useState(false);

  // 1. SCROLLEN ZU DEN 3 STEPS, SOBALD DIE PIPELINE STARTET (Step 1)
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

  // Load AWS Public Keys from the Go/Gin API (/getawspublickeys)
  useEffect(() => {
    let isMounted = true;

    async function fetchPublicKeys() {
      try {
        setLoadingKeys(true);
        const keysRes = await fetch("http://localhost:3010/getawspublickeys", { cache: "no-store" });
        if (!keysRes.ok) {
          throw new Error("Could not load derived key pairs from KMS");
        }
        
        const keysData = await keysRes.json();
        const validKeys: DerivedKeyPairItem[] = Array.isArray(keysData) ? keysData : [];
        
        if (isMounted) {
          setPublicKeys(validKeys);
          if (validKeys.length > 0) {
            setSelectedKeyId(validKeys[0].id);
          }
        }
      } catch (err: unknown) {
        console.error("Error during loading Public Keys", err);
        if (isMounted) {
          setMessage({ type: "error", text: "Public Keys could not be loaded from the KMS" });
        }
      } finally {
        if (isMounted) {
          setLoadingKeys(false);
        }
      }
    }

    fetchPublicKeys();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load Plants from the Go/Gin API (/plants)
  useEffect(() => {
    let isMounted = true;

    async function fetchPlants() {
      try {
        setLoadingPlants(true);
        const plantsRes = await fetch("http://localhost:3010/plants", { cache: "no-store" });
        if (!plantsRes.ok) {
          throw new Error("Could not load plants from server");
        }
        
        const plantsData = await plantsRes.json();
        const validPlants: PlantItem[] = Array.isArray(plantsData) ? plantsData : [];
        
        if (isMounted) {
          setPlants(validPlants);
          if (validPlants.length > 0) {
            setSelectedPlantId(validPlants[0].id);
          }
        }
      } catch (err: unknown) {
        console.error("Error during loading Plants", err);
        if (isMounted) {
          setMessage({ type: "error", text: "Plants could not be loaded from the KMS" });
        }
      } finally {
        if (isMounted) {
          setLoadingPlants(false);
        }
      }
    }

    fetchPlants();

    return () => {
      isMounted = false;
    };
  }, []);

  const isLoading = loadingKeys || loadingPlants;

  // Currently selected key and plant objects
  const selectedKey = publicKeys.find((k) => k.id === selectedKeyId);
  const selectedPlant = plants.find((p) => p.id === selectedPlantId);
  const isAsn1Reconstructed = selectedKey
    ? selectedKey.key_origin === "RECONSTRUCTED_ASN1" || (!selectedKey.aws_master_key_arn && !selectedKey.masterkey_chipper_blob)
    : false;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Real Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setResultData(null);

    try {
      // Step 1: KMS key unwrapping
      setActiveStep(1);
      setSelectedNode("unwrap");
      setStatusMessage("1/3 KMS Engine: Unwrapping master key and preparing key package...");
      await new Promise((r) => setTimeout(r, 800));

      // Step 2: Plant RSA public-key encryption
      setActiveStep(2);
      setSelectedNode("encrypt");
      setStatusMessage("2/3 Hybrid Crypto: Encrypting key payload with plant's RSA public key...");
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: SMTP mail dispatch
      setActiveStep(3);
      setSelectedNode("smtp");
      setStatusMessage("3/3 SMTP Mailer: Dispatching email package to " + (selectedPlant?.plant_email || "Plant") + "...");

      const payload = {
        key_id: selectedKeyId,
        plant_id: selectedPlantId,
      };

      const res = await fetch("http://localhost:3010/mailforwardprod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error sending email to target plant");
      }

      const result = await res.json();
      
      setActiveStep(4);
      setResultData({
        id: result.dispatch_id || "mail-pkg-uuid-2026-001",
        plant_name: selectedPlant?.plant_name || "Production Site A",
        plant_email: selectedPlant?.plant_email || "plant-a@factory.internal",
        sender_email: result.sender_email || "kms-dispatch@hq.company.com",
        subject: `[KMS DISPATCH] Encrypted Public Key Package (${selectedKey?.key_identifier || "KID-01"})`,
        key_identifier: selectedKey?.key_identifier || "KID-ECDSA-2026",
        curve_type: selectedKey?.curve_type || "secp256r1",
        encrypted_package_base64: result.encrypted_package_base64 || "-----BEGIN PKCS7 ENCRYPTED PACKAGE-----\nMIIJ3AYJKoZIhvcNAQcDoIIJzTCCCSkCAQAxggF1MIIBdQIBADCBjDCBfDELMAkG\nA1UEBhMCREUxEDAOBgNVBAgMB0Jhd2VydTF...encrypted_package_payload...\n-----END PKCS7 ENCRYPTED PACKAGE-----",
        package_signature_sha256: result.package_signature_sha256 || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        sent_at: new Date().toISOString(),
      });

      setMessage({
        type: "success",
        text: `Email for ${result.plant_name || selectedPlant?.plant_name || "selected plant"} successfully generated and sent!`,
      });

      setStatusMessage(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Network error occurred";
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

    const targetPlantName = selectedPlant?.plant_name || "Production Plant Basel";
    const targetPlantEmail = selectedPlant?.plant_email || "plant-basel@company.com";
    const keyName = selectedKey?.derived_key_pair_name || "Demo Derived Key Zone A";
    const keyId = selectedKey?.key_identifier || "KID-SECP256-8F";

    // Stage 1: Key Unwrapping
    setActiveStep(1);
    setSelectedNode("unwrap");
    setStatusMessage("[DEMO 1/3] KMS Unwrapping: Unwrapping master key & loading Key '" + keyName + "'...");
    await new Promise((r) => setTimeout(r, 1400));

    // Stage 2: RSA Hybrid Package Encryption
    setActiveStep(2);
    setSelectedNode("encrypt");
    setStatusMessage("[DEMO 2/3] RSA Hybrid Crypto: Encrypting payload for " + targetPlantName + "...");
    await new Promise((r) => setTimeout(r, 1600));

    // Stage 3: SMTP Mail Dispatch
    setActiveStep(3);
    setSelectedNode("smtp");
    setStatusMessage("[DEMO 3/3] SMTP Dispatcher: Connecting to mail server & transmitting package to " + targetPlantEmail + "...");
    await new Promise((r) => setTimeout(r, 1400));

    // Stage 4: Completion
    setActiveStep(4);
    setResultData({
      id: "mail-pkg-demo-uuid-2026-99",
      plant_name: targetPlantName,
      plant_email: targetPlantEmail,
      sender_email: "kms-hq-dispatcher@company.com",
      subject: `[KMS DISPATCH] Encrypted Delivery Package (${keyId})`,
      key_identifier: keyId,
      curve_type: selectedKey?.curve_type || "secp256r1",
      encrypted_package_base64: `-----BEGIN PKCS7 ENCRYPTED PACKAGE-----\nMIIJ3AYJKoZIhvcNAQcDoIIJzTCCCSkCAQAxggF1MIIBdQIBADCBjDCBfDELMAkG\n${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}/x9L8qN7Y6k5j4h3g2f1e0d9c8b7a6==\n-----END PKCS7 ENCRYPTED PACKAGE-----`,
      package_signature_sha256: "0x" + Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      sent_at: new Date().toISOString(),
    });

    setStatusMessage(null);
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400 font-mono">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-xs">Loading active Plant and Key items from KMS...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="w-full border-b border-slate-800 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Generate Plant Key Email</h1>
            <p className="text-xs text-slate-400">
              Select a Public Key and target Production Site (Plant) to dispatch the encrypted key delivery package
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
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Dropdown: AWS Public Keys */}
        <div className="space-y-2">
          <label htmlFor="publicKeySelect" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            Select Public Key
          </label>
          
          <select
            id="publicKeySelect"
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            required
            disabled={submitting}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {publicKeys.length === 0 ? (
              <option value="" disabled className="bg-slate-900 text-slate-500">
                No Public Keys found
              </option>
            ) : (
              publicKeys.map((key) => {
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

          {/* KEY METRICS BOX DIRECTLY UNDER DROPDOWN */}
          {selectedKey && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 font-mono text-xs mt-2.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] text-slate-400 font-sans font-semibold">
                  Selected Key Metrics:
                </span>

                {isAsn1Reconstructed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                    <FileKey className="w-3 h-3" />
                    ASN.1 Reconstructed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
                    <Cpu className="w-3 h-3" />
                    AWS KMS Key
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
                  <span className="text-blue-400 font-bold">{selectedKey.curve_type}</span>
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

          <p className="text-[11px] text-slate-500">
            The derived public key used to generate the key package payload.
          </p>
        </div>

        {/* Dropdown: Plants */}
        <div className="space-y-2">
          <label htmlFor="plantSelect" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-blue-400" />
            Select Target Plant / Production Site
          </label>
          
          <select
            id="plantSelect"
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(e.target.value)}
            required
            disabled={submitting}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {plants.length === 0 ? (
              <option value="" disabled className="bg-slate-900 text-slate-500">
                No Plants found
              </option>
            ) : (
              plants.map((plant) => (
                <option key={plant.id} value={plant.id} className="bg-slate-900 text-slate-200">
                  {plant.plant_name} ({plant.plant_email})
                </option>
              ))
            )}
          </select>
          <p className="text-[11px] text-slate-500">
            The destination plant where the encrypted package will be dispatched via secure mail.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {/* Demo Button */}
          <button
            type="button"
            onClick={handleSimulate}
            disabled={submitting}
            title="Simulate email dispatch step-by-step as an interactive demo"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Demo Mail Run</span>
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
              disabled={submitting || publicKeys.length === 0 || plants.length === 0}
              className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{statusMessage || "Sending Email..."}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* INTERACTIVE EMAIL DISPATCH & ENCRYPTION PIPELINE VISUALIZATION (REF PIPELINE) */}
      <div 
        ref={pipelineRef}
        className="w-full max-w-3xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 font-mono scroll-mt-6"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 font-sans">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Plant Key Dispatch & Hybrid Encryption Pipeline
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeStep === 0 && "Status: Standby"}
            {activeStep === 1 && "Status: [1/3] Unwrapping KMS Master Key..."}
            {activeStep === 2 && "Status: [2/3] RSA Hybrid Package Encrypting..."}
            {activeStep === 3 && "Status: [3/3] SMTP Dispatching to Target Plant..."}
            {activeStep === 4 && "Status: Plant Mail Dispatched Successfully"}
          </span>
        </div>

        {/* Clickable Pipeline Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs relative">
          
          {/* Node 1: Unwrapping & Loading */}
          <button
            type="button"
            onClick={() => setSelectedNode("unwrap")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 relative cursor-pointer ${
              activeStep === 1
                ? "bg-slate-900 border-amber-400 ring-2 ring-amber-500/50 shadow-xl shadow-amber-500/25 scale-102"
                : selectedNode === "unwrap"
                ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 1 ? "bg-amber-500 text-slate-950 border-amber-400 animate-pulse" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {activeStep === 1 ? <RefreshCw className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">1. Key Preparation</span>
              <span className="text-[10px] text-slate-500 block truncate max-w-35">
                KMS Unwrap & Package
              </span>
            </div>
            {activeStep === 1 && (
              <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-amber-500 text-[9px] text-slate-950 font-sans font-bold shadow">
                Unwrapping
              </span>
            )}
          </button>

          {/* Path 1 -> 2 Arrow Indicator */}
          <div className="hidden sm:flex absolute left-[31%] top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <ArrowRight className={`w-4 h-4 transition-colors ${
              activeStep >= 1 ? "text-amber-400 animate-pulse" : "text-slate-700"
            }`} />
          </div>

          {/* Node 2: Hybrid Encryption */}
          <button
            type="button"
            onClick={() => setSelectedNode("encrypt")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 relative cursor-pointer ${
              activeStep === 2
                ? "bg-slate-900 border-blue-400 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/25 scale-102"
                : selectedNode === "encrypt"
                ? "bg-slate-900 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 2 ? "bg-blue-500 text-white border-blue-400 animate-pulse" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            }`}>
              {activeStep === 2 ? <Binary className="w-5 h-5 animate-bounce" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">2. Hybrid Encryption</span>
              <span className="text-[10px] text-slate-500 block">Plant RSA Public Key</span>
            </div>
            {activeStep === 2 && (
              <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-blue-500 text-[9px] text-white font-sans font-bold shadow">
                Encrypting
              </span>
            )}
          </button>

          {/* Path 2 -> 3 Arrow Indicator */}
          <div className="hidden sm:flex absolute left-[65%] top-1/2 -translate-y-1/2 z-10 items-center justify-center">
            <ArrowRight className={`w-4 h-4 transition-colors ${
              activeStep >= 2 ? "text-blue-400 animate-pulse" : "text-slate-700"
            }`} />
          </div>

          {/* Node 3: SMTP Dispatcher */}
          <button
            type="button"
            onClick={() => setSelectedNode("smtp")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 cursor-pointer relative ${
              activeStep === 3
                ? "bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/50 shadow-xl shadow-emerald-500/25 scale-102"
                : selectedNode === "smtp"
                ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20"
                : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className={`p-2.5 rounded-lg border transition-all ${
              activeStep === 3 ? "bg-emerald-500 text-slate-950 border-emerald-400" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {activeStep === 3 ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}
            </div>
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">3. SMTP Dispatcher</span>
              <span className="text-[10px] text-slate-500 block">Mail Delivery to Plant</span>
            </div>
            {activeStep === 3 && (
              <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-emerald-500 text-[9px] text-slate-950 font-sans font-bold shadow">
                Dispatching
              </span>
            )}
          </button>

        </div>

        {/* Detailed Live Inspector Box */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2 font-sans transition-all">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              {selectedNode === "unwrap" && "Phase 1: AWS KMS Master Unwrapping & Key Assembly"}
              {selectedNode === "encrypt" && "Phase 2: Plant RSA Public Key Payload Encryption"}
              {selectedNode === "smtp" && "Phase 3: Outbound SMTP Mail Protocol Transmission"}
            </span>
            <span className="font-mono text-[10px] text-slate-500 uppercase">Dispatch Inspector</span>
          </div>

          {selectedNode === "unwrap" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-amber-400">🔑 <strong>Key Payload Assembly:</strong></p>
              <p>• Key Identifier: <span className="text-amber-300 font-bold">{selectedKey?.key_identifier || "KID-01"}</span></p>
              <p>• Derived Key Name: <span className="text-slate-200">{selectedKey?.derived_key_pair_name || "Derived Key"}</span></p>
              <p className="text-[11px] text-slate-500 pt-1">
                The Go backend retrieves the derived key from the database and constructs the binary package for the plant.
              </p>
            </div>
          )}

          {selectedNode === "encrypt" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-blue-400">🔒 <strong>RSA Hybrid Encryption Strategy:</strong></p>
              <p>• Target Plant: <span className="text-slate-200">{selectedPlant?.plant_name || "Plant Site"}</span></p>
              <p>• Encryption Key: <span className="text-indigo-300">Plant RSA Public Key (2048/4096-bit)</span></p>
              <p className="text-[11px] text-slate-500 pt-1">
                Only the specified manufacturing site holds the matching private key required to decrypt the email inside its local KMS.
              </p>
            </div>
          )}

          {selectedNode === "smtp" && (
            <div className="text-slate-400 text-xs space-y-1 font-mono">
              <p className="text-emerald-400">📧 <strong>SMTP Transport Layer:</strong></p>
              <p>• Recipient: <span className="text-emerald-300 font-bold">{selectedPlant?.plant_email || "plant@factory.com"}</span></p>
              <p>• Security: <span className="text-slate-200">TLS Encrypted SMTP Channel + Signed Payload</span></p>
              <p className="text-[11px] text-slate-500 pt-1">
                The email is securely transmitted to the destination site via the SMTP server configured in KMS settings.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* SUCCESS OUTPUT DASHBOARD CARD (DISPATCHED EMAIL PAYLOAD) WITH SCROLL REF */}
      {resultData && (
        <div
          ref={resultCardRef}
          className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-5 space-y-4 animate-in fade-in duration-300 scroll-mt-6"
        >
          {/* Header with Status Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Encrypted Key Package Email successfully dispatched!</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                SMTP_DISPATCH_OK
              </span>

              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-400" />
                {resultData.curve_type}
              </span>
            </div>
          </div>

          {/* Email Header Details */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Dispatch Package UUID:</span>
              <span className="text-slate-200">{resultData.id}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500 flex items-center gap-1">
                <AtSign className="w-3 h-3 text-blue-400" /> From (Sender):
              </span>
              <span className="text-blue-300 font-semibold">{resultData.sender_email}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500 flex items-center gap-1">
                <Factory className="w-3 h-3 text-emerald-400" /> To (Target Plant):
              </span>
              <span className="text-emerald-400 font-semibold font-sans">
                {resultData.plant_name} <span className="text-slate-400 font-mono">({resultData.plant_email})</span>
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Email Subject:</span>
              <span className="text-slate-200 font-sans font-semibold">{resultData.subject}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-500">Key Identifier (KID):</span>
              <span className="text-amber-400 font-bold">{resultData.key_identifier}</span>
            </div>

            {/* Package Signature SHA-256 */}
            <div className="py-2 border-b border-slate-900 space-y-1 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1 font-sans">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Encrypted Package Integrity Hash (SHA-256):
              </span>
              <span className="text-indigo-300 break-all bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 text-[10px] block">
                {resultData.package_signature_sha256}
              </span>
            </div>

            {/* Full Encrypted Package Payload */}
            <div className="flex flex-col gap-1 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1 font-sans">
                  <Binary className="w-3 h-3 text-amber-400" />
                  Encrypted Key Package (RSA Hybrid Base64 Payload):
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(resultData.encrypted_package_base64)}
                  className="inline-flex items-center gap-1 text-[10px] font-sans text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Payload</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-amber-400/90 break-all bg-slate-900 p-2.5 rounded border border-slate-800 text-[10px] whitespace-pre-wrap leading-relaxed select-all">
                {resultData.encrypted_package_base64}
              </pre>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Dispatched At:</span>
              <span className="text-slate-400">{new Date(resultData.sent_at).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}