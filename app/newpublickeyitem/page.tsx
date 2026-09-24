"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Key, 
  KeyRound, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Cpu,
  Calendar,
  Play,
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  Timer,
  AlertTriangle,
  FileCode2,
  Lock,
  Building,
  Tag,
  CheckSquare,
  Square,
  Search
} from "lucide-react";

interface MasterKeyOption {
  id: string;
  aws_master_key_id?: string;
  organization_name: string;
  kmskeyarn: string;
  alias: string;
  created_at: string;
  curve_type?: string;
  curvetype?: string;
  aws_status?: "Enabled" | "Disabled" | "PendingDeletion" | "NOT_FOUND" | "KMS_CLIENT_OFFLINE" | string;
  aws_verified?: boolean;
  deletion_date?: string;
}

interface XmlDefinition {
  id: string;
  name: string;
  type: "SECURITY_DEFINITION" | "DATA_CONCEPT" | "VERIFICATION_KEY_CUST" | "VERIFICATION_KEY_PLANT";
  file_signature?: string;
}

const HARDCODED_CURVETYPES = [
  { curvetype: "secp256r1", curve_description: "SEC 2, 256-bit Prime Curve (Standard Key-Length)" },
  { curvetype: "secp128r1", curve_description: "SEC 2, 128-bit Compact Curve (Ultra-Low Memory Tags)" },
  { curvetype: "ed25519", curve_description: "Edwards-curve Digital Signature Algorithm (High Performance)" },
];

function EllipticCurveIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 3 17 C 8 17, 8 7, 12 7 C 16 7, 16 17, 21 17" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" />
      <circle cx="7" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function NewDerivedKeyPage() {
  const router = useRouter();

  // REFS FÜR SCROLL-STEUERUNG UND FOKUS
  const pipelineRef = useRef<HTMLDivElement | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  // Dropdown Data States
  const [masterKeys, setMasterKeys] = useState<MasterKeyOption[]>([]);
  const [loadingMasterKeys, setLoadingMasterKeys] = useState(true);

  // XML Definitions States
  const [xmlDefinitions, setXmlDefinitions] = useState<XmlDefinition[]>([]);
  const [loadingXml, setLoadingXml] = useState(true);

  // Form States
  const [selectedMasterKeyId, setSelectedMasterKeyId] = useState("");
  const [derivedKeyName, setDerivedKeyName] = useState("");
  const [fallbackCurveType, setFallbackCurveType] = useState<string>(HARDCODED_CURVETYPES[0].curvetype);

  // Expiration Date State (Default: 5 Jahre ab heute)
  const getDefaultValidToDate = (yearsToAdd: number = 5) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + yearsToAdd);
    return d.toISOString().split("T")[0];
  };

  const [validToDate, setValidToDate] = useState<string>(getDefaultValidToDate(5));

  // XML Definition Assignments & Suche
  const [selectedXmlIds, setSelectedXmlIds] = useState<string[]>([]);
  const [xmlSearch, setXmlSearch] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derivation Result Data
  const [resultData, setResultData] = useState<{
    id: string;
    key_identifier: string;
    key_origin: string;
    publickey_name: string;
    curvetype: string;
    organization_name: string;
    parent_alias: string;
    parent_kms_arn: string;
    delta_x: string;
    pub_key_x: string;
    pub_key_y: string;
    assigned_xml_names: string[];
    valid_to: string;
    created_at: string;
  } | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  // DEMO & VISUALIZATION STATES
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<"kms" | "hkdf" | "ecc">("kms");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Initial Data Loading
  useEffect(() => {
    async function loadInitialData() {
      try {
        const resKeys = await fetch("http://localhost:3010/aws-masterkeys");
        if (resKeys.ok) {
          const dataKeys = await resKeys.json();
          const keysArray: MasterKeyOption[] = Array.isArray(dataKeys) ? dataKeys : [];
          setMasterKeys(keysArray);

          const firstActiveKey = keysArray.find(
            (k) => k.aws_status !== "PendingDeletion" && k.aws_status !== "Disabled"
          );
          if (firstActiveKey) {
            setSelectedMasterKeyId(firstActiveKey.id);
          } else if (keysArray.length > 0) {
            setSelectedMasterKeyId(keysArray[0].id);
          }
        }

        const resXml = await fetch("http://localhost:3010/xmldefinitionspk");
        if (resXml.ok) {
          const dataXml = await resXml.json();
          setXmlDefinitions(Array.isArray(dataXml) ? dataXml : []);
        }
      } catch (err) {
        console.error("Error loading form data:", err);
        setError("Could not load master keys or XML definitions.");
      } finally {
        setLoadingMasterKeys(false);
        setLoadingXml(false);
      }
    }

    loadInitialData();
  }, []);

  // DERIVED STATE: Automatische Ermittlung des Masterkey-Objekts und Kurventyps
  const selectedMasterKey = masterKeys.find((m) => m.id === selectedMasterKeyId);
  const effectiveCurveType = selectedMasterKey?.curve_type || selectedMasterKey?.curvetype || fallbackCurveType;

  // Toggle XML Checkbox
  const toggleXmlSelection = (xmlId: string) => {
    setSelectedXmlIds((prev) =>
      prev.includes(xmlId) ? prev.filter((id) => id !== xmlId) : [...prev, xmlId]
    );
  };

  // Filter der XMLs
  const filteredXmls = xmlDefinitions.filter(
    (xml) =>
      xml.name.toLowerCase().includes(xmlSearch.toLowerCase()) ||
      xml.id.toLowerCase().includes(xmlSearch.toLowerCase()) ||
      xml.type.toLowerCase().includes(xmlSearch.toLowerCase())
  );

  // SCROLL-EFFECTS
  useEffect(() => {
    if (activeStep === 1 && pipelineRef.current) {
      pipelineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeStep]);

  // RESULT-CARD SCROLL EFFECT
  useEffect(() => {
    if (resultData) {
      const animFrame = requestAnimationFrame(() => {
        if (resultCardRef.current) {
          resultCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          resultCardRef.current.focus();
        }
      });
      return () => cancelAnimationFrame(animFrame);
    }
  }, [resultData]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      errorRef.current.focus();
    }
  }, [error]);

  const handleCopyText = (fieldKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Real Form Submission (Backend API Call)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultData(null);

    if (!selectedMasterKey) {
      setError("Please select a valid global master key.");
      setLoading(false);
      return;
    }

    if (!selectedMasterKey.kmskeyarn) {
      setError("The selected master key is missing a valid AWS KMS Key ARN.");
      setLoading(false);
      return;
    }

    if (selectedMasterKey.aws_status === "PendingDeletion") {
      setError("Cannot derive key from a Master Key that is scheduled for deletion.");
      setLoading(false);
      return;
    }

    try {
      setActiveStep(1);
      setSelectedNode("kms");
      setStatusMessage("1/3 Master Key: Fetching Decrypt Seed for P_master...");
      await new Promise((r) => setTimeout(r, 600));

      setActiveStep(2);
      setSelectedNode("hkdf");
      setStatusMessage("2/3 Batch Secret: Generating random local x_batch...");
      await new Promise((r) => setTimeout(r, 600));

      setActiveStep(3);
      setSelectedNode("ecc");
      setStatusMessage("3/3 Offset Engine: Computing Delta X = (x_derived - x_batch) mod N...");

      // Typsicheres Auslesen ohne 'any'
      const masterKeyId = selectedMasterKey?.id || selectedMasterKey?.aws_master_key_id || "";
      const currentCurve = effectiveCurveType || selectedMasterKey?.curve_type || selectedMasterKey?.curvetype || "secp128r1";

      const payload = {
        id: masterKeyId,
        aws_master_key_id: masterKeyId,
        curvetype: currentCurve,
        curve_type: currentCurve,
        aws_master_arn: selectedMasterKey.kmskeyarn,
        publickey_name: derivedKeyName,
        xml_definition_ids: selectedXmlIds,
        valid_to: validToDate ? new Date(validToDate).toISOString() : null,
      };

      const response = await fetch("http://localhost:3010/newderivedkeypair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to create derived key (${response.status})`);
      }

      const resJson = await response.json();

      const assignedNames = xmlDefinitions
        .filter((x) => selectedXmlIds.includes(x.id))
        .map((x) => x.name);

      setActiveStep(4);
      setResultData({
        id: resJson.id || crypto.randomUUID(),
        key_identifier: resJson.key_identifier || `KID-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
        key_origin: "AWS_KMS_DECRYPT_DERIVED",
        publickey_name: derivedKeyName || "Derived Public Key",
        curvetype: currentCurve,
        organization_name: selectedMasterKey.organization_name || "Roche Pharma AG",
        parent_alias: selectedMasterKey.alias || "alias/master-key",
        parent_kms_arn: selectedMasterKey.kmskeyarn,
        delta_x: resJson.delta_x || "",
        pub_key_x: resJson.master_pub_x || "",
        pub_key_y: resJson.master_pub_y || "",
        assigned_xml_names: assignedNames,
        valid_to: validToDate,
        created_at: new Date().toISOString(),
      });

      setStatusMessage(null);
    } catch (err: unknown) {
      console.error("Failed to derive key:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  // INTERACTIVE DEMO RUN MODE
  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setResultData(null);

    const keyAlias = selectedMasterKey?.alias || "alias/roche-master-key";
    const orgName = selectedMasterKey?.organization_name || "Roche Pharma AG";
    const kmsArn = selectedMasterKey?.kmskeyarn || "arn:aws:kms:eu-central-1:123456789012:key/m-demo-88f9";
    const nameInput = derivedKeyName || "Demo Derived Key Pair";

    setActiveStep(1);
    setSelectedNode("kms");
    setStatusMessage("[DEMO 1/3] Master Key: Decrypting static seed for " + keyAlias + "...");
    await new Promise((r) => setTimeout(r, 800));

    setActiveStep(2);
    setSelectedNode("hkdf");
    setStatusMessage("[DEMO 2/3] Batch Engine: Generating x_batch for '" + nameInput + "'...");
    await new Promise((r) => setTimeout(r, 800));

    setActiveStep(3);
    setSelectedNode("ecc");
    setStatusMessage("[DEMO 3/3] Delta X Engine: Calculating Δx = (x_derived - x_batch) mod N...");
    await new Promise((r) => setTimeout(r, 800));

    const assignedNames = xmlDefinitions
      .filter((x) => selectedXmlIds.includes(x.id))
      .map((x) => x.name);

    setActiveStep(4);
    setResultData({
      id: crypto.randomUUID(),
      key_identifier: `KID-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      key_origin: "AWS_KMS_DECRYPT_DERIVED_SIMULATION",
      publickey_name: nameInput,
      curvetype: effectiveCurveType,
      organization_name: orgName,
      parent_alias: keyAlias,
      parent_kms_arn: kmsArn,
      delta_x: "E9F8D7C6B5A4938271605F4E3D2C1B0A9F8E7D6C5B4A392817065F4E3D2C1B0A",
      pub_key_x: "B8F9E2A1D0C3B4A5F6E7D8C9B0A1F2E3D4C5B6A7F8E9D0C1B2A3F4E5D6C7B8A",
      pub_key_y: effectiveCurveType === "ed25519" ? "" : "9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B9C8D7E6F5A4B3C2D1E0F9A8",
      assigned_xml_names: assignedNames.length > 0 ? assignedNames : ["Security_Definition_Global_v1.xml"],
      valid_to: validToDate,
      created_at: new Date().toISOString(),
    });

    setStatusMessage(null);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-2">
      {/* Header Bereich */}
      <div className="w-full border-b border-slate-800 pb-6">
        <Link
          href="/publickeys"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Create Derived Key Pair & Delta X Offset
            </h1>
            <p className="text-xs text-slate-400">
              Derive a batch key pair from a parent master key with pre-calculated key masking (Δx)
            </p>
          </div>
        </div>
      </div>

      {/* Fehlermeldung Banner */}
      {error && (
        <div 
          ref={errorRef}
          tabIndex={-1}
          className="w-full p-4 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-400 flex items-start gap-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/50 scroll-mt-6"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <p className="font-semibold">Key Derivation Failed</p>
            <p className="text-xs text-rose-400/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Formular-Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Dropdown: Global Master Key */}
        <div className="space-y-2">
          <label htmlFor="masterKeySelect" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            Global Master Key (P_master Anchor)
          </label>

          {loadingMasterKeys ? (
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-950 border border-slate-800" />
          ) : (
            <select
              id="masterKeySelect"
              value={selectedMasterKeyId}
              onChange={(e) => setSelectedMasterKeyId(e.target.value)}
              required
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {masterKeys.length === 0 ? (
                <option value="" disabled className="bg-slate-900 text-slate-500">
                  No Master Keys found
                </option>
              ) : (
                masterKeys.map((mk) => {
                  const isPending = mk.aws_status === "PendingDeletion";
                  const isDisabled = mk.aws_status === "Disabled";
                  const isInactive = isPending || isDisabled;
                  const curveLabel = mk.curve_type || mk.curvetype || "ed25519";

                  return (
                    <option 
                      key={mk.id} 
                      value={mk.id} 
                      disabled={isInactive}
                      className={isInactive ? "bg-slate-950 text-slate-600 italic" : "bg-slate-900 text-slate-200"}
                    >
                      {isPending
                        ? `⏳ [Pending Deletion] ${mk.organization_name} - alias/${mk.alias} (${curveLabel})`
                        : isDisabled
                        ? `🚫 [Disabled] ${mk.organization_name} - alias/${mk.alias} (${curveLabel})`
                        : `🟢 ${mk.organization_name} - alias/${mk.alias} (${curveLabel})`}
                    </option>
                  );
                })
              )}
            </select>
          )}

          {selectedMasterKey && (
            <div className="pt-1">
              {selectedMasterKey.aws_status === "PendingDeletion" ? (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-mono">
                  <Timer className="w-4 h-4 text-rose-400 shrink-0 animate-spin" />
                  <span>
                    Warning: This master key is <strong>scheduled for deletion</strong> in AWS KMS.
                  </span>
                </div>
              ) : selectedMasterKey.aws_status === "Disabled" ? (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-400 text-xs font-mono">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Warning: This master key is currently <strong>disabled</strong>.</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Parent root key used as trust anchor (P_master) for mask calculation (Δx).
                </p>
              )}
            </div>
          )}
        </div>

        {/* Derived Key Name */}
        <div className="space-y-2">
          <label htmlFor="derivedKeyName" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Derived Key Pair Name
          </label>
          <input
            id="derivedKeyName"
            type="text"
            required
            placeholder="e.g. Derived Key Pair Zone A-1"
            value={derivedKeyName}
            onChange={(e) => setDerivedKeyName(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
          />
        </div>

        {/* Grid: Curve Type & Valid To Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="curvetype" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <EllipticCurveIcon className="w-3.5 h-3.5 text-emerald-400" />
                Curve Type Spec
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                [Auto-Matched to Root]
              </span>
            </label>
            <select
              id="curvetype"
              value={effectiveCurveType}
              onChange={(e) => setFallbackCurveType(e.target.value)}
              required
              disabled={loading || Boolean(selectedMasterKey?.curve_type || selectedMasterKey?.curvetype)}
              className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 font-mono text-xs text-emerald-400 font-bold focus:outline-none transition-all cursor-pointer disabled:opacity-80"
            >
              {HARDCODED_CURVETYPES.map((b) => (
                <option key={b.curvetype} value={b.curvetype} className="bg-slate-900 text-slate-200 font-normal">
                  {b.curvetype} — {b.curve_description}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="validTo" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Valid Until (Expiration Date)
            </label>
            <div className="space-y-1.5">
              <input
                id="validTo"
                type="date"
                required
                value={validToDate}
                onChange={(e) => setValidToDate(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer color-scheme-dark disabled:opacity-50"
              />
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Presets:</span>
                <button
                  type="button"
                  onClick={() => setValidToDate(getDefaultValidToDate(1))}
                  disabled={loading}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  +1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setValidToDate(getDefaultValidToDate(3))}
                  disabled={loading}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  +3 Years
                </button>
                <button
                  type="button"
                  onClick={() => setValidToDate(getDefaultValidToDate(5))}
                  disabled={loading}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-amber-400/90 transition-all cursor-pointer disabled:opacity-50"
                >
                  +5 Years
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Derivation Pipeline Parameters Box */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-indigo-400 font-sans font-semibold">
            <Cpu className="w-4 h-4" />
            <span>Derivation Pipeline Parameters</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1">
            <div>
              <span className="text-slate-500 block">Curve Length:</span>
              <span className="text-emerald-400 font-mono">{effectiveCurveType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Root Anchor:</span>
              <span className="text-amber-400 font-mono truncate block">
                {selectedMasterKey?.alias ? `alias/${selectedMasterKey.alias}` : "Automatic"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Expiration:</span>
              <span className="text-slate-300 font-mono">{validToDate || "No Limit"}</span>
            </div>
          </div>
        </div>

        <hr className="border-slate-800 my-4" />

        {/* XML DEFINITIONS SEKTION MIT FILTER & MEHRFACHAUSWAHL */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              Attach XML Definitions ({selectedXmlIds.length} selected)
            </label>
            {selectedXmlIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedXmlIds([])}
                className="text-xs text-rose-400 hover:underline cursor-pointer"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter XML definitions..."
              value={xmlSearch}
              onChange={(e) => setXmlSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 font-sans text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="max-h-52 overflow-y-auto border border-slate-800 rounded-xl p-2 space-y-1 bg-slate-950 custom-scrollbar">
            {loadingXml ? (
              <div className="p-4 text-center text-xs text-slate-500 italic flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Loading XML definitions...</span>
              </div>
            ) : filteredXmls.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-500">No matching XML definitions found.</p>
            ) : (
              filteredXmls.map((xml) => {
                const isChecked = selectedXmlIds.includes(xml.id);
                return (
                  <label 
                    key={xml.id} 
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                      isChecked
                        ? "bg-indigo-500/10 border-indigo-500/30 text-slate-200"
                        : "bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700 text-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleXmlSelection(xml.id)}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isChecked ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-700 bg-slate-900"
                    }`}>
                      {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-slate-200 truncate">{xml.name}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{xml.id}</div>
                    </div>

                    <div className="shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {xml.type}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSimulate}
            disabled={loading}
            title="Simulate derivation pipeline step-by-step as an interactive demo"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Demo Derivation</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={loading}
              className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading || 
                masterKeys.length === 0 || 
                selectedMasterKey?.aws_status === "PendingDeletion"
              }
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{statusMessage || "Deriving Key..."}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Derive Key Pair</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* PIPELINE VISUALIZATION */}
      <div 
        ref={pipelineRef}
        className="w-full max-w-3xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-4 font-mono scroll-mt-6"
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 font-sans">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Masked Key Derivation Pipeline
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs relative">
          <button
            type="button"
            onClick={() => setSelectedNode("kms")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
              activeStep === 1
                ? "bg-slate-900 border-amber-400 ring-2 ring-amber-500/50 shadow-xl scale-102"
                : selectedNode === "kms"
                ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/30"
                : "bg-slate-950/60 border-slate-800"
            }`}
          >
            <Cloud className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">
                1. Static Master P_master
              </span>
              <span className="text-[10px] text-slate-500 block">Root Public Key Anchor</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedNode("hkdf")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
              activeStep === 2
                ? "bg-slate-900 border-blue-400 ring-2 ring-blue-500/50 shadow-xl scale-102"
                : selectedNode === "hkdf"
                ? "bg-slate-900 border-blue-500 ring-2 ring-blue-500/30"
                : "bg-slate-950/60 border-slate-800"
            }`}
          >
            <Cpu className="w-5 h-5 text-blue-400" />
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">
                2. Batch Key x_batch
              </span>
              <span className="text-[10px] text-slate-500 block">Local Derivation Seed</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedNode("ecc")}
            className={`p-3.5 rounded-xl border transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
              activeStep === 3
                ? "bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/50 shadow-xl scale-102"
                : selectedNode === "ecc"
                ? "bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/30"
                : "bg-slate-950/60 border-slate-800"
            }`}
          >
            <EllipticCurveIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-sans font-semibold text-slate-200 block text-[11px]">
                3. Offset Δx
              </span>
              <span className="text-[10px] text-slate-500 block">
                (x_master - x_batch) mod n
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* RESULT CARD */}
      {resultData && (
        <div
          ref={resultCardRef}
          tabIndex={-1}
          className="w-full max-w-3xl bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-2xl focus:outline-none scroll-mt-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Batch Key Pair & Delta X Offset Generated</h3>
                <p className="text-[11px] text-slate-400">{resultData.publickey_name}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {resultData.curvetype}
            </span>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase flex items-center gap-1 mb-1">
                <Tag className="w-3 h-3 text-indigo-400" /> Key Identifier
              </span>
              <div className="flex items-center justify-between">
                <p className="text-slate-200 font-bold truncate">{resultData.key_identifier}</p>
                <button
                  type="button"
                  onClick={() => handleCopyText("kid", resultData.key_identifier)}
                  className="text-slate-500 hover:text-slate-300 ml-1 cursor-pointer"
                >
                  {copiedField === "kid" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase flex items-center gap-1 mb-1">
                <Building className="w-3 h-3 text-blue-400" /> Organization
              </span>
              <p className="text-slate-200 font-bold truncate">{resultData.organization_name}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase flex items-center gap-1 mb-1">
                <Lock className="w-3 h-3 text-amber-400" /> Parent Alias
              </span>
              <p className="text-slate-200 font-bold truncate">{resultData.parent_alias}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Key Origin
              </span>
              <p className="text-slate-300 text-[11px] truncate">{resultData.key_origin}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-rose-400" /> Expiration Date
              </span>
              <p className="text-slate-300 text-[11px] truncate">{resultData.valid_to || "No Expiration"}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase flex items-center gap-1 mb-1">
                <FileCode2 className="w-3.5 h-3.5 text-purple-400" /> Assigned XMLs
              </span>
              <p className="text-slate-300 text-[11px] truncate">
                {resultData.assigned_xml_names.length} Definition(s)
              </p>
            </div>
          </div>

          {/* Assigned XML File Names List */}
          {resultData.assigned_xml_names.length > 0 && (
            <div className="font-mono text-xs space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Assigned Security Definitions:</span>
              <div className="flex flex-wrap gap-1.5">
                {resultData.assigned_xml_names.map((name, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[10px]">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Parent AWS Key ARN */}
          <div className="font-mono text-xs">
            <span className="text-slate-500 block text-[10px] uppercase mb-1">Parent AWS KMS ARN</span>
            <p className="text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all text-[11px]">
              {resultData.parent_kms_arn}
            </p>
          </div>

          {/* Cryptographic Key Slices */}
          <div className="space-y-3 font-mono text-xs">
            {/* DELTA X OFFSET SLICE */}
            {resultData.delta_x && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 text-[10px] uppercase flex items-center gap-1">
                    Derived Mask Offset (Δx = (x_derived - x_batch) mod N)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText("deltax", resultData.delta_x)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === "deltax" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "deltax" ? "Copied" : "Copy Δx"}</span>
                  </button>
                </div>
                <p className="text-amber-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all select-all font-semibold text-[11px]">
                  {resultData.delta_x}
                </p>
              </div>
            )}

            {/* PUBLIC KEY X */}
            {resultData.pub_key_x && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 text-[10px] uppercase flex items-center gap-1">
                    Public Key X (Static Root Anchor P_master)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText("pubx", resultData.pub_key_x)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === "pubx" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "pubx" ? "Copied" : "Copy X"}</span>
                  </button>
                </div>
                <p className="text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all select-all font-semibold text-[11px]">
                  {resultData.pub_key_x}
                </p>
              </div>
            )}

            {/* PUBLIC KEY Y */}
            {resultData.curvetype !== "ed25519" && resultData.pub_key_y && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 text-[10px] uppercase">Public Key Y</span>
                  <button
                    type="button"
                    onClick={() => handleCopyText("puby", resultData.pub_key_y)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === "puby" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "puby" ? "Copied" : "Copy Y"}</span>
                  </button>
                </div>
                <p className="text-emerald-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 break-all select-all font-semibold text-[11px]">
                  {resultData.pub_key_y}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}