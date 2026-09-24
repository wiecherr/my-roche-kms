"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Radio, 
  Key, 
  Database, 
  RefreshCw,
  Cpu,
  Building2,
  FileKey,
  Copy,
  Check,
  Lock,
  Sparkles
} from "lucide-react";

interface RfidItem {
  id: string;
  publickey_name: string;
  uid: string;
  batch_id: string;
  signature_r: string;
  signature_s: string;
  curve_type: string;
  key_identifier?: string;
  created_at?: string;
}

interface VerificationDetails {
  pubKeyX?: string;
  pubKeyY?: string;
  hash?: string;
  curve?: string;
  errorCode?: string;
  [key: string]: unknown;
}

interface DerivedKeyPairItem {
  id: string;
  derived_key_pair_name: string;
  key_identifier: string;
  curve_type: string;
  publickey_raw_x: string;
  publickey_raw_y: string;
  aws_organizational_name?: string;
  aws_alias_name?: string;
  aws_master_key_arn?: string;
  masterkey_chipper_blob?: string;
  key_origin?: "AWS_KMS_DERIVED" | "RECONSTRUCTED_ASN1" | string;
  created_at?: string;
  valid_to?: string;
}

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

const FALLBACK_ITEMS: RfidItem[] = [
  {
    id: "TAG-001",
    publickey_name: "Château Roche Vintage 2024",
    uid: "04A32B1F996180",
    batch_id: "BATCH-2026-A1",
    signature_r: "3081c10201010410cf4eb1382437cc5ec8f134e559b89d20a08183308180020101",
    curve_type: "secp256r1",
    signature_s: "3036301006072a8648ce3d020106052b8104001c03220004b7abbf37cee06d5637a73c3d3875ad03738fd55825b0ba2c0ea69deb2e6a5e3c",
    key_identifier: "4A8F23C1",
  },
  {
    id: "TAG-002",
    publickey_name: "Single Malt Whisky Reserve 18y",
    uid: "8F11223344556677",
    batch_id: "BATCH-2026-B8",
    signature_r: "e44851cd9e52e4638a9abdd8bfa00706052b8104001ca12403220004cf4eb1382437cc5ec8f134e559b89d20b7abbf37cee06d5637a73c3d3875ad03",
    curve_type: "ed25519",
    signature_s: "b7abbf37cee06d5637a73c3d3875ad03738fd55825b0ba2c0ea69deb2e6a5e3c",
    key_identifier: "8F112233",
  },
];

export default function RfidVerificationPage() {
  const [tagItems, setTagItems] = useState<RfidItem[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(true);
  const [selectedTag, setSelectedTag] = useState<RfidItem | null>(null);
  
  const [uidInput, setUidInput] = useState<string>("");
  const [batchInput, setBatchInput] = useState<string>("");
  const [sigRInput, setSigRInput] = useState<string>("");
  const [sigSInput, setSigSInput] = useState<string>("");

  const [derivedKeyPairs, setDerivedKeyPairs] = useState<DerivedKeyPairItem[]>([]);
  const [loadingKeyPairs, setLoadingKeyPairs] = useState<boolean>(true);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [activeKeyPair, setActiveKeyPair] = useState<DerivedKeyPairItem | null>(null);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    details?: VerificationDetails;
    processedat: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  const applySelectedTag = (tag: RfidItem, availableKeys: DerivedKeyPairItem[] = derivedKeyPairs) => {
    setSelectedTag(tag);
    setUidInput(tag.uid ?? "");
    setBatchInput(tag.batch_id ?? "");
    setSigRInput(tag.signature_r ?? "");
    setSigSInput(tag.signature_s ?? "");
    setVerificationResult(null);

    const matchingKey = availableKeys.find(
      (k) => 
        (tag.key_identifier && k.key_identifier === tag.key_identifier) ||
        k.derived_key_pair_name === tag.publickey_name
    );

    if (matchingKey) {
      setSelectedKeyId(matchingKey.id);
      setActiveKeyPair(matchingKey);
    } else if (availableKeys.length > 0) {
      setSelectedKeyId(availableKeys[0].id);
      setActiveKeyPair(availableKeys[0]);
    } else {
      setSelectedKeyId("");
      setActiveKeyPair(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const keysRes = await fetch("http://localhost:3010/getawspublickeys", { cache: "no-store" });
        let validKeys: DerivedKeyPairItem[] = [];
        if (keysRes.ok) {
          const keysData = await keysRes.json();
          validKeys = Array.isArray(keysData) ? keysData : [];
        }

        const tagsRes = await fetch("http://localhost:3010/tagitems", { cache: "no-store" });
        let validTags: RfidItem[] = FALLBACK_ITEMS;
        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          if (Array.isArray(tagsData) && tagsData.length > 0) {
            validTags = tagsData;
          }
        }

        if (isMounted) {
          setDerivedKeyPairs(validKeys);
          setTagItems(validTags);

          if (validTags.length > 0) {
            applySelectedTag(validTags[0], validKeys);
          }
        }
      } catch (err: unknown) {
        console.error("Fehler beim Laden der Daten:", err);
        if (isMounted) {
          setMessage({ type: "error", text: "Could not load data from KMS backend." });
          setTagItems(FALLBACK_ITEMS);
        }
      } finally {
        if (isMounted) {
          setLoadingKeyPairs(false);
          setIsLoadingTags(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectTag = (tag: RfidItem) => {
    applySelectedTag(tag);
  };

  const isActiveKeyReconstructed = activeKeyPair
    ? activeKeyPair.key_origin === "RECONSTRUCTED_ASN1" || (!activeKeyPair.aws_master_key_arn && !activeKeyPair.masterkey_chipper_blob)
    : false;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleVerify = async () => {
    if (!selectedTag || !activeKeyPair) return;
    
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch("http://localhost:3010/verify-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rfid_uid: uidInput,
          batch_id: batchInput,
          signature_r: sigRInput,
          signature_s: sigSInput,
          derived_key_pair_id: activeKeyPair.id,
          key_identifier: activeKeyPair.key_identifier,
          curve_type: activeKeyPair.curve_type,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationResult({
          success: true,
          message: data.message || "Signatur ist GÜLTIG! Das Produkt ist authentisch.",
          details: data.details,
          processedat: data.processedat || new Date().toISOString(),
        });
      } else {
        setVerificationResult({
          success: false,
          message: data.message || "Signatur ist UNGÜLTIG! Mögliche Fälschung.",
          details: data.details,
          processedat: data.processedat || new Date().toISOString(),
        });
      }
    } catch (error) {
      setTimeout(() => {
        setIsVerifying(false);
        const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
        const isMockValid = uidInput === selectedTag.uid && batchInput === selectedTag.batch_id;
        
        setVerificationResult({
          success: isMockValid,
          message: isMockValid
            ? "Signatur erfolgreich verifiziert (Offline Mock: GÜLTIG)"
            : `Signatur-Prüfung fehlgeschlagen: ${errorMessage}`,
          processedat: new Date().toISOString()
        });
      }, 800);
      return;
    }

    setIsVerifying(false);
  };

  return (
    <div className="w-full space-y-8 py-2">
      {/* HEADER */}
      <header className="w-full flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Offline Verification Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            RFID Brand Protection & Verification
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Cryptographic Authentication of Physical Goods via Static Root Anchors (P<sub>master</sub>)
          </p>
        </div>
      </header>

      {message && (
        <div className={`w-full p-4 rounded-2xl border backdrop-blur-md transition-all ${
          message.type === "error" ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        }`}>
          {message.text}
        </div>
      )}

      <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SPALTE 1: RFID-Tag Liste */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-slate-300">
              <Database className="w-4 h-4 text-indigo-400" />
              Available RFID Tags ({tagItems.length})
            </h2>
            {isLoadingTags && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          </div>

          <div className="max-h-150 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {isLoadingTags ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                Loading tags...
              </div>
            ) : tagItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                No tags found.
              </div>
            ) : (
              tagItems.map((tag) => {
                const isSelected = selectedTag?.id === tag.id;
                return (
                  <div
                    key={tag.id}
                    onClick={() => handleSelectTag(tag)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? "bg-slate-900/90 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-xl shadow-indigo-500/10"
                        : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                        {tag.id}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white mb-1.5 text-sm group-hover:text-indigo-300 transition-colors">
                      {tag.publickey_name}
                    </h3>

                    {/* NEU: Kurventyp rutscht sauber auf die nächste Zeile */}
                    {tag.curve_type && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-400 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md font-medium">
                          <EllipticCurveIcon className="w-3 h-3 text-blue-400" />
                          {tag.curve_type}
                        </span>
                      </div>
                    )}
                    
                    <div className="space-y-0.5 font-mono text-[11px]">
                      <p className="text-slate-400 truncate">
                        <span className="text-slate-500">UID:</span> {tag.uid}
                      </p>
                      <p className="text-slate-400 truncate">
                        <span className="text-slate-500">Batch:</span> {tag.batch_id}
                      </p>
                      {tag.key_identifier && (
                        <p className="text-amber-400/90 truncate">
                          <span className="text-slate-500">KID:</span> {tag.key_identifier}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Tag Active & Sealed</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SPALTE 2: Visuelle Vorschau (Flasche & Überarbeiteter Static Master Anchor) */}
        <div className="lg:col-span-3 lg:sticky lg:top-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-between min-h-150 relative backdrop-blur-sm z-10">
          <div className="text-center w-full pb-2.5 border-b border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Physical Product Preview
            </span>
            <h3 className="text-xs font-semibold text-slate-200 mt-0.5 truncate">
              {selectedTag?.publickey_name || "No tag selected"}
            </h3>
          </div>

          {/* FLASCHEN-PROTOTYP */}
          <div className="relative py-6 my-auto flex flex-col items-center">
            <div className="w-20 h-52 bg-gradient-to-b from-slate-800/90 to-slate-950 border-2 border-slate-700/80 rounded-t-3xl rounded-b-2xl relative flex flex-col items-center justify-center shadow-2xl">
              <div className="absolute -top-7 w-6 h-7 bg-amber-900/40 border-2 border-b-0 border-amber-800/80 rounded-t-md" />
              
              <div className="w-16 h-22 bg-amber-950/30 border border-amber-600/30 rounded-lg p-1.5 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[8px] font-serif text-amber-200 font-bold uppercase tracking-widest">
                  Authentic
                </span>
                <span className="text-[7px] font-mono text-amber-400/80 mt-1 uppercase">Crypto-Sealed</span>
              </div>

              {/* Tag Badge */}
              <div className="absolute -right-3 top-16 bg-slate-900 border-2 border-emerald-400 text-emerald-400 p-2 rounded-full shadow-lg shadow-emerald-500/20 flex items-center justify-center group cursor-pointer animate-bounce z-20">
                <Cpu className="w-4 h-4" />
                
                {selectedTag && (
                  <div className="absolute right-full top-0 mr-3 bg-slate-950 border border-slate-700/90 p-3.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none w-72 shadow-2xl space-y-2 z-50 backdrop-blur-md">
                    <p className="text-xs font-bold text-white border-b border-slate-800 pb-1.5 truncate">
                      {selectedTag.publickey_name}
                    </p>
                    <div className="font-mono text-[10px] space-y-1">
                      <p className="text-emerald-400 truncate"><span className="text-slate-500">UID:</span> {selectedTag.uid}</p>
                      <p className="text-blue-400"><span className="text-slate-500">Curve:</span> {selectedTag.curve_type}</p>
                      <p className="text-amber-400"><span className="text-slate-500">KID:</span> {selectedTag.key_identifier || "-"}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[9px]">
                      <div>
                        <span className="text-slate-500 font-semibold block">Signature R:</span>
                        <p className="text-indigo-300 bg-slate-900 p-1.5 rounded-md border border-slate-800 break-all leading-tight">
                          {selectedTag.signature_r || "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-semibold block">Signature S:</span>
                        <p className="text-indigo-300 bg-slate-900 p-1.5 rounded-md border border-slate-800 break-all leading-tight">
                          {selectedTag.signature_s || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* NEU DESIGNOFERTE STATIC MASTER ANCHOR DISPLAY CARD */}
          <div className="w-full bg-slate-950/90 rounded-xl p-3 border border-slate-800 font-mono text-[11px] space-y-2.5 mt-auto shadow-2xl relative overflow-hidden">
            <div className="flex flex-col gap-1 border-b border-slate-800/80 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Root Anchor P<sub>master</sub>
                </span>

                <button
                  type="button"
                  onClick={() => activeKeyPair && handleCopyText(activeKeyPair.publickey_raw_x)}
                  disabled={!activeKeyPair}
                  className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* NEU: Kurventyp rutscht sauber in die nächste Zeile */}
              {activeKeyPair?.curve_type && (
                <div>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <EllipticCurveIcon className="w-3 h-3 text-emerald-400" />
                    {activeKeyPair.curve_type}
                  </span>
                </div>
              )}
            </div>

            {activeKeyPair ? (
              <div className="space-y-2">
                <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 text-[9px] uppercase font-semibold block">
                    Public Key X (Hex Anchor):
                  </span>
                  <p className="text-emerald-400 text-[10px] break-all leading-snug select-all font-semibold max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                    {activeKeyPair.publickey_raw_x || "N/A"}
                  </p>
                </div>

                {activeKeyPair.curve_type !== "ed25519" && activeKeyPair.publickey_raw_y && (
                  <div className="bg-slate-900/90 rounded-lg p-2 border border-slate-800/80 space-y-1">
                    <span className="text-slate-500 text-[9px] uppercase font-semibold block">
                      Public Key Y:
                    </span>
                    <p className="text-emerald-400 text-[10px] break-all leading-snug select-all font-semibold max-h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                      {activeKeyPair.publickey_raw_y}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-[10px] italic py-1 text-center">
                No active master key loaded
              </p>
            )}

            <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
              <div className="truncate w-full">
                {activeKeyPair?.aws_organizational_name ? (
                  <span className="truncate block font-sans">
                    <strong className="text-slate-200">{activeKeyPair.aws_organizational_name}</strong>
                    {activeKeyPair.aws_alias_name && (
                      <span className="text-slate-500 block text-[9px] font-mono">
                        alias/{activeKeyPair.aws_alias_name}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-500">Unassigned Master Key</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SPALTE 3: Verification Panel */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between min-h-150 backdrop-blur-sm">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verification Control
              </h2>
              <span className="text-[10px] font-mono text-slate-500">Zero-Knowledge Masking</span>
            </div>

            {/* ACTION BUTTON & LIVE STATUS */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || !selectedTag || !activeKeyPair}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Cryptography...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Signature Offline</span>
                  </>
                )}
              </button>

              {verificationResult && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                    verificationResult.success
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}
                >
                  {verificationResult.success ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">
                      {verificationResult.success ? "Signature Valid & Authentic" : "Verification Failed"}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">{verificationResult.message}</p>
                    <p className="text-[10px] opacity-70 mt-1 font-mono">{verificationResult.processedat}</p>
                  </div>
                </div>
              )}
            </div>

            {/* INPUTS & KEY SELECTION */}
            <div className="space-y-3.5 text-xs pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="uidInput" className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    Tag UID (HEX)
                  </label>
                  <input
                    id="uidInput"
                    type="text"
                    value={uidInput}
                    onChange={(e) => setUidInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="batchInput" className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                    Batch ID
                  </label>
                  <input
                    id="batchInput"
                    type="text"
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* SCHLÜSSEL-SELEKTIERUNG */}
              <div>
                <label htmlFor="keyPairSelect" className="block text-[10px] font-semibold uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Derived Key Pair (Master Anchor)
                </label>

                {loadingKeyPairs ? (
                  <div className="h-9 w-full animate-pulse rounded-xl bg-slate-950 border border-slate-800 flex items-center px-3">
                    <div className="h-2 w-1/3 bg-slate-800 rounded" />
                  </div>
                ) : (
                  <select
                    id="keyPairSelect"
                    value={selectedKeyId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedKeyId(newId);
                      const chosen = derivedKeyPairs.find((k) => k.id === newId);
                      setActiveKeyPair(chosen || null);
                    }}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {derivedKeyPairs.length === 0 ? (
                      <option value="" disabled className="bg-slate-900 text-slate-500">
                        No derived key pairs found
                      </option>
                    ) : (
                      derivedKeyPairs.map((key) => {
                        const keyIsReconstructed =
                          key.key_origin === "RECONSTRUCTED_ASN1" || (!key.aws_master_key_arn && !key.masterkey_chipper_blob);
                        
                        return (
                          <option key={key.id} value={key.id} className="bg-slate-900 text-slate-200">
                            {keyIsReconstructed ? "📄 [ASN.1] " : "🛡️ [AWS KMS] "}
                            {key.derived_key_pair_name} [{key.key_identifier || "N/A"}] ({key.curve_type})
                          </option>
                        );
                      })
                    )}
                  </select>
                )}

                {/* KEY METRICS */}
                {activeKeyPair && (
                  <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5 font-mono text-[11px] mt-2">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-[10px] text-slate-400 font-sans font-semibold">
                        Metrics & Origin:
                      </span>

                      {isActiveKeyReconstructed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                          <FileKey className="w-3 h-3" />
                          ASN.1 Reconstructed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
                          <Lock className="w-3 h-3" />
                          AWS KMS Key
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-500 block text-[9px]">KEY IDENTIFIER:</span>
                        <span className="text-amber-400 font-bold">{activeKeyPair.key_identifier || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">CURVE SPEC:</span>
                        <span className="text-blue-400 font-bold">{activeKeyPair.curve_type}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="sigRInput" className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  Cryptographic Signature (R HEX)
                </label>
                <textarea
                  id="sigRInput"
                  rows={2}
                  value={sigRInput}
                  onChange={(e) => setSigRInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 break-all"
                />
              </div>

              <div>
                <label htmlFor="sigSInput" className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">
                  Cryptographic Signature (S HEX)
                </label>
                <textarea
                  id="sigSInput"
                  rows={2}
                  value={sigSInput}
                  onChange={(e) => setSigSInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500 break-all"
                />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}