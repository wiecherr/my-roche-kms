"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Database, 
  Tag, 
  Key, 
  Clock, 
  ShieldCheck, 
  ArrowRight, 
  Cpu, 
  Trash2, 
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface RfidTagItem {
  id: string;
  publickey_name: string;
  uid: string;
  batch_id: string;
  signature_r: string;
  signature_s: string;
  created_at: string;
  curve_type: string;
  key_identifier?: string;
}

// Elliptische Kurve Icon
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

export default function RfidTagItemsPage() {
  const [rfidtagitems, setRfidtagitems] = useState<RfidTagItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Daten abrufen (Kaskadenfrei)
  useEffect(() => {
    let isMounted = true;

    async function loadRfidTags() {
      try {
        const response = await fetch("http://localhost:3010/tagitems", {
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Server meldet Fehler ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        if (isMounted) {
          setRfidtagitems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("API-Fehler:", error);
        if (isMounted) {
          setMessage({
            type: "error",
            text: error instanceof Error ? error.message : "Fehler beim Laden der RFID Tags.",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadRfidTags();

    return () => {
      isMounted = false;
    };
  }, []);

  // Einzelnes RFID-Tag löschen
  const handleDeleteTag = async (item: RfidTagItem) => {
    const confirmDelete = window.confirm(
      `Möchtest du das RFID-Tag mit ID "${item.id}" (UID: ${item.uid}) wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden.`
    );

    if (!confirmDelete) return;

    setDeletingId(item.id);
    setMessage(null);

    try {
      const res = await fetch("http://localhost:3010/delete-tag-item", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: item.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Fehler beim Löschen des RFID Tags.");
      }

      setRfidtagitems((prev) => prev.filter((t) => t.id !== item.id));
      setMessage({
        type: "success",
        text: `RFID-Tag mit ID "${item.id}" wurde erfolgreich gelöscht.`,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Ein unerwarteter Fehler ist aufgetreten.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-6 py-2">
      {/* Header Bereich */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">
              RFID Tag Items Overview
            </h1>
            <p className="text-xs text-slate-400">
              Overview of all registered RFID tags and their cryptographic signatures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-medium text-slate-300">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Count: <span className="text-white font-bold">{rfidtagitems.length}</span>
          </span>
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
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-xs font-mono">Loading RFID tag items from database...</p>
        </div>
      ) : rfidtagitems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
          <Tag className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium">No RFID tag items found in the database.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rfidtagitems.slice(0, 50).map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-xl space-y-4"
            >
              {/* Oberer Bereich: ID, Badges & Aktionen */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-base font-bold text-white font-mono">
                    ID: {item.id}
                  </span>

                  {item.key_identifier && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-mono text-xs text-amber-400 font-semibold">
                      Key ID: {item.key_identifier}
                    </span>
                  )}

                  {item.curve_type && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-mono text-xs text-blue-400 font-medium">
                      <EllipticCurveIcon className="w-3.5 h-3.5 text-blue-400" />
                      {item.curve_type}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                  {/* Lösch-Button */}
                  <button
                    onClick={() => handleDeleteTag(item)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    title="Delete RFID Tag Item"
                  >
                    {deletingId === item.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{deletingId === item.id ? "Deleting..." : "Delete"}</span>
                  </button>


                </div>
              </div>

              {/* Mittlerer Bereich: Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Key className="w-3 h-3 text-indigo-400" />
                    Public Key Name
                  </span>
                  <span className="text-slate-200 font-sans font-medium truncate block">
                    {item.publickey_name || "-"}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-emerald-400" />
                    Tag UID
                  </span>
                  <span className="text-emerald-400 font-bold truncate block">
                    {item.uid}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    Batch ID
                  </span>
                  <span className="text-slate-200 truncate block">
                    {item.batch_id}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    Created At
                  </span>
                  <span className="text-slate-400 truncate block font-sans">
                    {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                  </span>
                </div>
              </div>

              {/* Unterer Bereich: Cryptographic Signatures */}
              {(item.signature_r || item.signature_s) && (
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] space-y-2">
                  {item.signature_r && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">
                        Signature R (Payload):
                      </span>
                      <p className="text-emerald-400 break-all select-all leading-relaxed">
                        {item.signature_r}
                      </p>
                    </div>
                  )}

                  {item.signature_s && (
                    <div className="pt-1 border-t border-slate-900">
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">
                        Signature S (Payload):
                      </span>
                      <p className="text-emerald-400 break-all select-all leading-relaxed">
                        {item.signature_s}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}