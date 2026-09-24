"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileCode, 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  ShieldCheck, 
  Database, 
  Key, 
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  Code,
  Trash2
} from "lucide-react";

interface XmlDefinition {
  id: string;
  name: string;
  type: "SECURITY_DEFINITION" | "DATA_CONCEPT" | "VERIFICATION_KEY_CUST" | "VERIFICATION_KEY_PLANT";
  file_signature?: string;
  content_blob: string;
  created_at: string;
}

export default function XmlDefinitionsOverviewPage() {
  const [definitions, setDefinitions] = useState<XmlDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // States for Content Modal
  const [selectedXmlContent, setSelectedXmlContent] = useState<XmlDefinition | null>(null);
  const [loadingModalContent, setLoadingModalContent] = useState<boolean>(false);
  const [copiedModalContent, setCopiedModalContent] = useState<boolean>(false);

  // Fetch definitions from Go Backend
  useEffect(() => {
    let isMounted = true;

    async function fetchDefinitions() {
      try {
        const response = await fetch("http://localhost:3010/xmldefinitions", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load XML definitions.");
        }
        const data = await response.json();
        if (isMounted) {
          setDefinitions(Array.isArray(data) ? data : []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError((err as Error).message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDefinitions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = async (def: XmlDefinition) => {
    setSelectedXmlContent(def);

    if (!def.content_blob) {
      setLoadingModalContent(true);
      try {
        const res = await fetch(`http://localhost:3010/xmldefinition/${def.id}`);
        if (res.ok) {
          const detailData = await res.json();
          const fullContent = detailData.content_blob || detailData.content || detailData.xml_content || "";
          setSelectedXmlContent((prev) => (prev ? { ...prev, content_blob: fullContent } : null));
        }
      } catch (err) {
        console.error("Error loading XML content:", err);
      } finally {
        setLoadingModalContent(false);
      }
    }
  };

  const handleCopyUuid = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyModalContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedModalContent(true);
    setTimeout(() => setCopiedModalContent(false), 2000);
  };

  // Delete XML Definition Handler
  const handleDelete = async (def: XmlDefinition) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the XML definition "${def.name}" (ID: ${def.id})?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeletingId(def.id);

    try {
      const res = await fetch("http://localhost:3010/delete-xmldefinition", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: def.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to delete XML definition.");
      }

      setDefinitions((prev) => prev.filter((item) => item.id !== def.id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDefinitions = definitions.filter((def) => {
    const matchesSearch =
      def.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (def.file_signature && def.file_signature.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === "ALL" || def.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full space-y-6 py-2">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">XML Definitions Registry</h1>
            <p className="text-xs text-slate-400">
              Manage and reference uploaded Security Definitions and Data Concepts
            </p>
          </div>
        </div>

        <Link
          href="/xmldefinitionitem"
          className="inline-flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition text-xs shrink-0 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New XML Definition</span>
        </Link>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, UUID, or signature..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="w-full sm:w-64 relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
          >
            <option value="ALL" className="bg-slate-900">All Types</option>
            <option value="SECURITY_DEFINITION" className="bg-slate-900">Security Definitions</option>
            <option value="DATA_CONCEPT" className="bg-slate-900">Data Concepts</option>
            <option value="VERIFICATION_KEY_PLANT" className="bg-slate-900">Verification Key Plants</option>
            <option value="VERIFICATION_KEY_CUST" className="bg-slate-900">Verification Key Customers</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-xs font-mono">Loading XML definitions from backend...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-400 flex items-center gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading registry: {error}</span>
        </div>
      ) : filteredDefinitions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
          <FileCode className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">No XML definitions found.</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search filters or upload a new file.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="max-h-[calc(100vh-280px)] min-h-75 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
            <table className="w-full text-left border-collapse min-w-187.5">
              <thead className="sticky top-0 z-10 bg-slate-950 border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400 tracking-wider shadow-md">
                <tr>
                  <th className="py-3.5 px-4 bg-slate-950">Type & Actions</th>
                  <th className="py-3.5 px-4 bg-slate-950">Name / Title</th>
                  <th className="py-3.5 px-4 bg-slate-950">Definition UUID</th>
                  <th className="py-3.5 px-4 bg-slate-950">File Signature</th>
                  <th className="py-3.5 px-4 bg-slate-950">Uploaded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs font-mono">
                {filteredDefinitions.map((def) => (
                  <tr key={def.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* SPALTE 1: Type Badge, View Button & Delete Button */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {def.type === "SECURITY_DEFINITION" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Security Def
                          </span>
                        ) : def.type === "VERIFICATION_KEY_PLANT" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Key className="w-3.5 h-3.5" />
                            Verification Key Plants
                          </span>
                        ) : def.type === "VERIFICATION_KEY_CUST" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Key className="w-3.5 h-3.5" />
                            Verification Key Customers
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <Database className="w-3.5 h-3.5" />
                            Data Concept
                          </span>
                        )}

                        <button
                          onClick={() => handleOpenModal(def)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-all cursor-pointer border border-slate-700/60 shrink-0"
                          title="View XML Content"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handleDelete(def)}
                          disabled={deletingId === def.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-[11px] font-semibold text-rose-400 border border-rose-500/30 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                          title="Delete Definition"
                        >
                          {deletingId === def.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>{deletingId === def.id ? "Deleting..." : "Delete"}</span>
                        </button>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-sans font-semibold text-slate-100 whitespace-nowrap max-w-50 truncate" title={def.name}>
                      {def.name}
                    </td>

                    {/* UUID */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-950 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-800 font-mono text-[11px]">
                          {def.id}
                        </span>
                        <button
                          onClick={() => handleCopyUuid(def.id)}
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-sans transition-colors cursor-pointer"
                        >
                          {copiedId === def.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Signature */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {def.file_signature ? (
                        <span title={def.file_signature} className="text-emerald-400/90 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono text-[11px]">
                          {def.file_signature.substring(0, 14)}...
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">None</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-sans text-xs">
                      {new Date(def.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Count */}
          <div className="bg-slate-950/90 px-4 py-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
            <span>
              Showing <strong className="text-slate-200">{filteredDefinitions.length}</strong> of <strong className="text-slate-200">{definitions.length}</strong> definitions
            </span>
          </div>
        </div>
      )}

      {/* XML Content Preview Modal */}
      {selectedXmlContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm font-sans">
                    {selectedXmlContent.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    UUID: {selectedXmlContent.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedXmlContent.content_blob && (
                  <button
                    onClick={() => handleCopyModalContent(selectedXmlContent.content_blob || "")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    {copiedModalContent ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied XML</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy XML</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setSelectedXmlContent(null)}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Terminal */}
            <div className="p-4 overflow-auto font-mono text-[11px] leading-relaxed bg-slate-950 text-emerald-400/90 flex-1 scrollbar-thin scrollbar-thumb-slate-800 min-h-62.5">
              {loadingModalContent ? (
                <div className="h-full flex flex-col items-center justify-center py-12 gap-3 text-slate-400 font-sans">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                  <span className="text-xs">Fetching XML content blob from backend...</span>
                </div>
              ) : selectedXmlContent.content_blob ? (
                <pre className="whitespace-pre-wrap break-all select-all font-mono">
                  {selectedXmlContent.content_blob}
                </pre>
              ) : (
                <div className="p-12 text-center text-slate-500 italic font-sans">
                  No content blob available for this definition.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                onClick={() => setSelectedXmlContent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}