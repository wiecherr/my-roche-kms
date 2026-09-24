"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Factory, 
  Building2, 
  Mail, 
  ArrowLeft, 
  PlusCircle, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";

export default function CreatePlantPage() {
  const router = useRouter();

  // Zustände
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Formular-Values
  const [plantName, setPlantName] = useState<string>("");
  const [plantEmail, setPlantEmail] = useState<string>("");

  useEffect(() => {
    async function initialize() {
      // Optionale Initialisierungslogik falls benötigt
    }
    initialize();
  }, []);

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      plant_name: plantName.trim(),
      plant_email: plantEmail.trim(),
    };

    try {
      const res = await fetch("http://localhost:3010/plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fehler beim Erstellen der Production Site");
      }

      const result = await res.json();
      setMessage({
        type: "success",
        text: `Plant ${result.plant_name || plantName} successfully created!`,
      });

      // Formular zurücksetzen
      setPlantName("");
      setPlantEmail("");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Network Error: An error occurred.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="w-full border-b border-slate-800 pb-6">
        <Link
          href="/plants"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plants Overview</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Create New Production Plant</h1>
            <p className="text-xs text-slate-400">
              Register a production site and automatically issue a new private/public RSA PEM key pair stream
            </p>
          </div>
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

      {/* Formular-Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Input: Plant Name */}
        <div className="space-y-2">
          <label htmlFor="plantName" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            Plant / Production Site Name
          </label>
          <input
            type="text"
            id="plantName"
            value={plantName}
            onChange={(e) => setPlantName(e.target.value)}
            placeholder="e.g. Roche Mannheim Plant 04"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            required
            autoFocus
          />
        </div>

        {/* Input: Plant Email */}
        <div className="space-y-2">
          <label htmlFor="plantEmail" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-indigo-400" />
            Plant Contact E-Mail
          </label>
          <input
            type="email"
            id="plantEmail"
            value={plantEmail}
            onChange={(e) => setPlantEmail(e.target.value)}
            placeholder="e.g. plant-mannheim@roche.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            required
          />
          <p className="text-[11px] text-slate-500">
            The target email address where key delivery packages and notification manifests will be sent for this plant.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Creating Plant...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Create Plant</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}