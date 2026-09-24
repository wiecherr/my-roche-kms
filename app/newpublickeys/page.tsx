"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Key, 
  Building2, 
  Clock, 
  Database, 
  Plus, 
  ShieldCheck, 
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Calendar,
  X,
  Copy,
  Check,
  Code2,
  Cpu,
  FileKey
} from "lucide-react";

interface XmlDefinitionInfo {
  id: string;
  name: string;
  type?: string;
}

interface XmlDefinitionFullDetail {
  id: string;
  name: string;
  type: string;
  file_signature?: string;
  content_xml: string;
  created_at: string;
}

interface DerivedKeyPairItem {
  id: string;
  derived_key_pair_name: string;
  aws_organizational_name?: string;
  aws_alias_name?: string;
  aws_master_key_arn?: string;
  masterkey_chipper_blob?: string;
  key_origin?: "AWS_KMS_DERIVED" | "RECONSTRUCTED_ASN1" | string;
  publickey_raw_x: string;
  publickey_raw_y: string;
  curve_type: string;
  key_identifier: string;
  xml_definitions?: XmlDefinitionInfo[];
  xml_definition_names?: string[];
  created_at: string;
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

export default function PublicKeysPage() {
  const [keyPairs, setKeyPairs] = useState<DerivedKeyPairItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States for XML Modal
  const [selectedXmlDetail, setSelectedXmlDetail] = useState<XmlDefinitionFullDetail | null>(null);
  const [loadingXmlDetail, setLoadingXmlDetail] = useState<boolean>(false);
  const [xmlModalOpen, setXmlModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Initial loading of key pairs
  useEffect(() => {
    let isMounted = true;

    async function loadKeyPairs() {
      try {
        const response = await fetch("http://localhost:3010/getawspublickeys", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (isMounted) {
          setKeyPairs(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("API Error:", error);
        if (isMounted) {
          setMessage({ type: "error", text: "Could not load derived key pairs from server." });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadKeyPairs();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch XML detail & open modal
  const handleOpenXmlDetail = async (xmlId: string) => {
    setLoadingXmlDetail(true);
    setXmlModalOpen(true);
    setSelectedXmlDetail(null);

    try {
      const res = await fetch(`http://localhost:3010/xmldefinition-detail?id=${encodeURIComponent(xmlId)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch XML definition details");
      }
      const data: XmlDefinitionFullDetail = await res.json();
      setSelectedXmlDetail(data);
    } catch (err) {
      console.error("Error fetching XML details:", err);
    } finally {
      setLoadingXmlDetail(false);
    }
  };

  // Copy XML Content
  const handleCopyXML = () => {
    if (selectedXmlDetail?.content_xml) {
      navigator.clipboard.writeText(selectedXmlDetail.content_xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Delete key pair function (Now sends both id AND key_identifier to backend)
  const handleDelete = async (item: DerivedKeyPairItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the derived key pair "${item.derived_key_pair_name}" (Key Identifier: ${item.key_identifier || "N/A"})?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeletingId(item.id);
    setMessage(null);

    try {
      // Sent JSON body includes BOTH 'id' and 'key_identifier'
      const res = await fetch("http://localhost:3010/delete-derived-key-pair", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: item.id, 
          key_identifier: item.key_identifier || "" 
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to delete the key pair.");
      }

      setKeyPairs((prev) => prev.filter((k) => k.id !== item.id));
      setMessage({
        type: "success",
        text: `Derived Key Pair "${item.derived_key_pair_name}" (Key Identifier: ${item.key_identifier}) was successfully deleted.`,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-6 py-2">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">
              Derived Public Key Pairs Overview
            </h1>
            <p className="text-xs text-slate-400">
              Overview of all derived public keys, curve metrics, key origin (AWS KMS / ASN.1), attached XML definitions, and expiration states
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-medium text-slate-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Count: <span className="text-white font-bold">{keyPairs.length}</span>
          </span>

          <Link
            href="/newpublickeyitem"
            className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition text-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Derive New Key</span>
          </Link>
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

      {/* Content Section */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-xs font-mono">Loading derived public key pairs...</p>
        </div>
      ) : keyPairs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
          <Key className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No derived public key pairs found in database.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {keyPairs.slice(0, 50).map((item) => {
            const isExpired = item.valid_to ? new Date(item.valid_to) < new Date() : false;

            const isAsn1Reconstructed =
              item.key_origin === "RECONSTRUCTED_ASN1" ||
              (!item.aws_master_key_arn && !item.masterkey_chipper_blob);

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-xl space-y-4 relative overflow-hidden"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-bold text-white font-sans">
                      {item.derived_key_pair_name}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 font-mono text-xs text-amber-400 font-semibold">
                      ID: {item.key_identifier || "N/A"}
                    </span>

                    {/* KEY ORIGIN BADGE */}
                    {isAsn1Reconstructed ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 font-mono text-xs text-amber-400 font-semibold" title="Imported from raw ASN.1 structure or XML file">
                        <FileKey className="w-3.5 h-3.5 text-amber-400" />
                        ASN.1 Reconstructed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 font-mono text-xs text-indigo-400 font-semibold" title="Derived directly via AWS KMS Master Key">
                        <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        AWS KMS Key
                      </span>
                    )}

                    {item.curve_type && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-mono text-xs text-blue-400 font-semibold">
                        <EllipticCurveIcon className="w-3 h-3 text-blue-400" />
                        {item.curve_type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                        isExpired
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isExpired ? "Expired Key" : "Active Key"}</span>
                    </div>

                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
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

                {/* Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-400" />
                      AWS Organization & Alias
                    </span>
                    <span className="text-slate-200 font-sans font-medium truncate block">
                      {isAsn1Reconstructed ? (
                        <span className="text-slate-500 italic">External / Local Import</span>
                      ) : (
                        `${item.aws_organizational_name || "-"} (${item.aws_alias_name ? `alias/${item.aws_alias_name}` : "-"})`
                      )}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      Created At
                    </span>
                    <span className="text-slate-300 truncate block font-sans">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      Valid Until
                    </span>
                    <span className={`truncate block font-sans ${isExpired ? "text-rose-400 font-semibold" : "text-slate-300"}`}>
                      {item.valid_to ? new Date(item.valid_to).toLocaleDateString() : "Unlimited"}
                    </span>
                  </div>
                </div>

                {/* XML Definitions Badges */}
                {item.xml_definitions && item.xml_definitions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <FileCode className="w-3.5 h-3.5 text-amber-400" />
                      Attached XML Definitions (Click to view):
                    </span>
                    {item.xml_definitions.map((xml) => (
                      <button
                        key={xml.id}
                        onClick={() => handleOpenXmlDetail(xml.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 font-mono text-xs text-indigo-300 hover:text-indigo-200 transition-all cursor-pointer shadow-sm"
                      >
                        📄 <span>{xml.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Raw Coordinates Box */}
                {(item.publickey_raw_x || item.publickey_raw_y) && (
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[11px] space-y-2">
                    {item.publickey_raw_x && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">
                          Public Key Raw Hex (X Coordinate):
                        </span>
                        <p className="text-emerald-400 break-all select-all leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          {item.publickey_raw_x}
                        </p>
                      </div>
                    )}
                    {item.publickey_raw_y && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5">
                          Public Key Raw Hex (Y Coordinate):
                        </span>
                        <p className="text-emerald-400 break-all select-all leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                          {item.publickey_raw_y}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* XML Detail Modal */}
      {xmlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  {selectedXmlDetail ? selectedXmlDetail.name : "XML Definition Details"}
                </h3>
              </div>
              <button
                onClick={() => setXmlModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {loadingXmlDetail ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                  <span className="text-xs font-mono">Fetching XML structure...</span>
                </div>
              ) : selectedXmlDetail ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">ID:</span>
                      <span className="text-slate-300 truncate block">{selectedXmlDetail.id}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">TYPE:</span>
                      <span className="text-amber-400 font-semibold">{selectedXmlDetail.type}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-slate-500 block text-[10px]">CREATED:</span>
                      <span className="text-slate-300 truncate block">
                        {new Date(selectedXmlDetail.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        XML Structure & Content
                      </span>
                      <button
                        onClick={handleCopyXML}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-all cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied!" : "Copy XML"}</span>
                      </button>
                    </div>

                    <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-96 leading-relaxed select-all">
                      <code>{selectedXmlDetail.content_xml || "<!-- No XML content available -->"}</code>
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-rose-400 text-xs font-mono">
                  Failed to load details for this XML definition.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setXmlModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}