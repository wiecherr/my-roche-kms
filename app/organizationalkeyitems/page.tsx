"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  KeyRound, 
  Building2, 
  Tag, 
  Clock, 
  Database, 
  Plus, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Timer,
  AlertTriangle,
  GitCommit,
  Lock
} from "lucide-react";

interface AWSMasterKeyItem {
  id: string;
  organization_name: string;
  kmskeyarn: string;
  alias: string;
  created_at: string;
  curve_type?: string;
  public_key_static_x?: string; // Base64 oder Hex vom Go-Backend
  public_key_static_y?: string; // Base64 oder Hex vom Go-Backend
  aws_status?: "Enabled" | "Disabled" | "PendingDeletion" | "NOT_FOUND" | "KMS_CLIENT_OFFLINE" | string;
  aws_verified?: boolean;
  deletion_date?: string;
}

export default function AWSMasterKeysOverviewPage() {
  const [masterKeys, setMasterKeys] = useState<AWSMasterKeyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Helper: Formatierung von Base64 / Hex für Public-Key-Bytes
  const formatPublicKeyHex = (rawInput?: string, curveType?: string): string => {
    if (!rawInput) return "-";

    let hexResult = rawInput.trim();

    // 1. Dekodierung von Base64 (erkennbar an '=' oder nicht-hex Zeichen)
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(rawInput) && (rawInput.includes("=") || rawInput.length % 4 === 0);
    const isStrictHex = /^[0-9a-fA-F]+$/.test(rawInput);

    if (isBase64 && !isStrictHex) {
      try {
        const binaryStr = atob(rawInput);
        hexResult = Array.from(binaryStr)
          .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("");
      } catch {
        hexResult = rawInput;
      }
    }

    // 0x-Präfix säubern
    hexResult = hexResult.replace(/^0x/i, "");

    // 2. Präzisions-Trimming für secp128r1 (16 Bytes = 32 Hex-Zeichen)
    if (curveType === "secp128r1" && hexResult.length > 32) {
      return hexResult.slice(-32);
    }

    return hexResult;
  };

  useEffect(() => {
    let isMounted = true;

    async function loadKeys() {
      try {
        const response = await fetch("http://localhost:3010/aws-masterkeys", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Fehler beim Laden: ${response.statusText}`);
        }

        const data = await response.json();
        if (isMounted) {
          setMasterKeys(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("API-Error:", error);
        if (isMounted) {
          setMessage({ type: "error", text: "Fehler beim Laden der AWS Master Keys vom Server." });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadKeys();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteKey = async (item: AWSMasterKeyItem) => {
    const confirmDelete = window.confirm(
      `Möchtest du den AWS Master Key für "${item.organization_name}" (alias/${item.alias}) wirklich löschen?\n\nDies plant die Löschung in der AWS Cloud (ScheduleKeyDeletion) ein und entfernt den Key aus der Datenbank.`
    );

    if (!confirmDelete) return;

    setDeletingId(item.id);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:3010/delete-aws-key", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Löschen des Keys.");
      }

      setMasterKeys((prev) => prev.filter((k) => k.id !== item.id));
      setMessage({
        type: "success",
        text: `Löschantrag für "${item.organization_name}" erfolgreich an AWS übermittelt und DB-Eintrag entfernt.`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Ein unerwarteter Fehler ist aufgetreten.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-6 py-2">
      {/* Header Bereich */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">
              AWS KMS Master Keys Overview
            </h1>
            <p className="text-xs text-slate-400">
              Overview of all provisioned cloud root keys and static verification public keys
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-medium text-slate-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Count: <span className="text-white font-bold">{masterKeys.length}</span>
          </span>

          <Link
            href="/orgamasterkeys"
            className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition text-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Key</span>
          </Link>
        </div>
      </div>

      {/* Benachrichtigungen */}
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

      {/* Content Sektion */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-xs font-mono">Loading AWS KMS Master Keys...</p>
        </div>
      ) : masterKeys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
          <KeyRound className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No AWS KMS Master Keys found in the database.</p>
          <p className="text-xs text-slate-500 mt-1">Provision a new cloud master key to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {masterKeys.slice(0, 50).map((keyItem) => {
            const isPendingDeletion = keyItem.aws_status === "PendingDeletion";
            const isDisabled = keyItem.aws_status === "Disabled";
            const isNotFound = keyItem.aws_status === "NOT_FOUND";

            const formattedX = formatPublicKeyHex(keyItem.public_key_static_x, keyItem.curve_type);
            const formattedY = formatPublicKeyHex(keyItem.public_key_static_y, keyItem.curve_type);

            return (
              <div
                key={keyItem.id}
                className={`bg-slate-900 border rounded-2xl p-5 hover:border-slate-700 transition-all shadow-xl space-y-4 relative overflow-hidden ${
                  isPendingDeletion
                    ? "border-rose-500/40 bg-rose-950/10"
                    : "border-slate-800"
                }`}
              >
                {/* Oberer Bereich */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span className="text-base font-bold text-white font-sans">
                        {keyItem.organization_name}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 font-mono text-xs text-indigo-400 font-semibold">
                      <Tag className="w-3 h-3 text-indigo-400" />
                      alias/{keyItem.alias}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400">
                      DB ID: {keyItem.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                    {/* DYNAMISCHES AWS STATUS BADGE */}
                    {isPendingDeletion ? (
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse"
                        title={
                          keyItem.deletion_date
                            ? `Scheduled deletion: ${new Date(keyItem.deletion_date).toLocaleString()}`
                            : "Scheduled for deletion in AWS KMS"
                        }
                      >
                        <Timer className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                        <span>Pending Deletion</span>
                      </div>
                    ) : isDisabled ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Disabled</span>
                      </div>
                    ) : isNotFound ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>AWS Key Not Found</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Active KMS Key</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mittlerer Bereich: Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-400" />
                      Organization Name
                    </span>
                    <span className="text-slate-200 font-sans font-medium truncate block">
                      {keyItem.organization_name || "-"}
                    </span>
                  </div>

                  {/* ANZEIGE DES KURVENTYPS */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <GitCommit className="w-3 h-3 text-emerald-400" />
                      Curve Spec
                    </span>
                    <span className="text-emerald-400 font-bold uppercase truncate block">
                      {keyItem.curve_type || "ed25519"}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Provisioned At
                    </span>
                    <span className="text-slate-400 truncate block font-sans">
                      {keyItem.created_at ? new Date(keyItem.created_at).toLocaleString() : "-"}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5 text-rose-400" />
                      Deletion Date (AWS)
                    </span>
                    <span className={`truncate block font-sans ${isPendingDeletion ? "text-rose-400 font-semibold" : "text-slate-400"}`}>
                      {keyItem.deletion_date
                        ? new Date(keyItem.deletion_date).toLocaleString()
                        : isPendingDeletion
                        ? "Pending (7-30 Days)"
                        : "None (Active Key)"}
                    </span>
                  </div>
                </div>

                {/* Unterer Bereich: AWS KMS Key ARN Terminal */}
                {keyItem.kmskeyarn && (
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-blue-400" />
                      AWS KMS Key Amazon Resource Name (ARN):
                    </span>
                    <p className="text-blue-400 break-all select-all leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      {keyItem.kmskeyarn}
                    </p>
                  </div>
                )}

                {/* STATIC ROOT PUBLIC KEY TERMINAL (X & Y HEX) */}
                {(keyItem.public_key_static_x || keyItem.public_key_static_y) && (
                  <div className="bg-slate-950 rounded-xl p-3 border border-emerald-500/20 font-mono text-[11px] space-y-2">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-emerald-400">
                      <span className="flex items-center gap-1 font-semibold">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        Static Root Public Key ($P_{"{master}"}$ / Reader Trust Anchor)
                      </span>
                      <span className="text-slate-500 font-sans">
                        {keyItem.curve_type === "secp128r1" ? "16 Bytes Precision" : "32 Bytes Precision"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {keyItem.public_key_static_x && (
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">
                            {keyItem.curve_type === "secp256r1" || keyItem.curve_type === "secp128r1"
                              ? "Public Key X Coordinate (Raw Hex):"
                              : "Public Key Compressed Bytes (Raw Hex):"}
                          </span>
                          <p className="text-emerald-400 break-all select-all leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[10px] tracking-wider">
                            {formattedX}
                          </p>
                        </div>
                      )}

                      {keyItem.public_key_static_y && (
                        <div>
                          <span className="text-[10px] text-slate-500 block mb-0.5">
                            Public Key Y Coordinate (Raw Hex):
                          </span>
                          <p className="text-emerald-400 break-all select-all leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[10px] tracking-wider">
                            {formattedY}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}