"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Factory, 
  Mail, 
  Clock, 
  Key, 
  ArrowRight, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  RefreshCw 
} from "lucide-react";

interface PlantItem {
  id: string;
  plant_name: string;
  plant_email: string;
  plant_pem_priv: string;
  plant_pem_pub: string;
  created_at: string;
}

// Interaktive Komponente für die komprimierte PEM-Schlüssel-Anzeige
function PemKeyViewer({ label, pemKey, isPrivate }: { label: string; pemKey: string; isPrivate?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pemKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Erzeugt eine saubere 2-Zeilen-Vorschau (Header & Footer des PEM-Strings)
  const getPreviewText = (rawKey: string) => {
    const lines = rawKey.trim().split("\n");
    if (lines.length <= 2) return rawKey;
    return `${lines[0]}\n... [${lines.length - 2} lines hidden] ...\n${lines[lines.length - 1]}`;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1 font-mono">
          <Key className={`w-3 h-3 ${isPrivate ? "text-rose-400" : "text-emerald-400"}`} />
          {label}
        </span>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            type="button"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white transition-colors bg-slate-900 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            type="button"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 cursor-pointer"
          >
            <span>{expanded ? "Collapse" : "Expand"}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div 
        onClick={() => setExpanded(!expanded)}
        className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10px] cursor-pointer hover:border-slate-700 transition-all group"
      >
        <p className={`break-all leading-relaxed ${isPrivate ? "text-rose-400/90" : "text-emerald-400/90"} ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
          {expanded ? pemKey : getPreviewText(pemKey)}
        </p>
      </div>
    </div>
  );
}

export default function PlantsPage() {
  const [plantitems, setPlantitems] = useState<PlantItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchPlants() {
      try {
        const response = await fetch("http://localhost:3010/plants", { cache: "no-store" });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        
        if (isMounted) {
          setPlantitems(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("API-Error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPlants();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="w-full space-y-6 py-2">
      {/* Header Bereich */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white">
              Plants Overview
            </h1>
            <p className="text-xs text-slate-400">
              Overview of all registered production sites and their associated RSA key pairs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-medium text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            Count: <span className="text-white font-bold">{plantitems.length}</span>
          </span>
        </div>
      </div>

      {/* Content Sektion */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-xs font-mono">Loading production sites from database...</p>
        </div>
      ) : plantitems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
          <Factory className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-sm font-medium">No plants found in the database.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plantitems.slice(0, 50).map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-xl space-y-4"
            >
              {/* Oberer Bereich: Name & Details Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/publickeys/${item.id}`}
                    className="text-base font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    {item.plant_name}
                  </Link>

                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 font-mono text-xs text-blue-400">
                    ID: {item.id}
                  </span>
                </div>


              </div>

              {/* Mittlerer Bereich: Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-indigo-400" />
                    E-Mail Address
                  </span>
                  <span className="text-slate-200 font-sans font-medium truncate block">
                    {item.plant_email || "-"}
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

              {/* Unterer Bereich: Smart PEM Keys Viewer */}
              {(item.plant_pem_priv || item.plant_pem_pub) && (
                <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80 space-y-3">
                  {item.plant_pem_priv && (
                    <PemKeyViewer 
                      label="Plant PEM Private Key (RSA)" 
                      pemKey={item.plant_pem_priv} 
                      isPrivate={true} 
                    />
                  )}

                  {item.plant_pem_pub && (
                    <PemKeyViewer 
                      label="Plant PEM Public Key (RSA)" 
                      pemKey={item.plant_pem_pub} 
                      isPrivate={false} 
                    />
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