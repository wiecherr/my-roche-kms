"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  UploadCloud, 
  FileCode, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Save, 
  RefreshCw 
} from "lucide-react";

export default function XmlUploadPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id?: string; error?: string } | null>(null);

  // Zustand für die Vorschau
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  // Handler für die Dateiauswahl -> Liest die Datei direkt im Browser für die Vorschau
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewContent(null);
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);

    // Datei als Text einlesen für die Vorschau
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPreviewContent(text);
    };
    reader.readAsText(file);
  }

  // Formular-Submit an das Go Backend
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("http://localhost:3010/xmldefinition", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload error.");
      }

      setResult({ id: data.id });
      // Formular und Vorschau nach Erfolg zurücksetzen
      (event.target as HTMLFormElement).reset();
      setPreviewContent(null);
      setSelectedFileName("");
    } catch (error) {
      setResult({ error: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="w-full border-b border-slate-800 pb-6">
        <Link
          href="/xmldefinitions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to XML Definitions Registry</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Upload XML Definition</h1>
            <p className="text-xs text-slate-400">
              Upload and store security definitions, data concepts, or keylibrary XML files
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Linke Seite: Formular-Card */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-5">
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input: XML File */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                Select XML File *
              </label>
              <div className="relative">
                <input
                  type="file"
                  name="file"
                  accept=".xml"
                  required
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 file:transition-all cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-1.5 focus:outline-none"
                />
              </div>
            </div>

            {/* Input: Name (Optional) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Definition Name (Optional)
              </label>
              <input
                type="text"
                name="name"
                placeholder={selectedFileName || "e.g. Roche.Verification CON 000 00"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Select: Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                Definition Type *
              </label>
              <select
                name="type"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
              >
                <option value="SECURITY_DEFINITION" className="bg-slate-900">
                  Security Definition (securityDefinitions)
                </option>
                <option value="DATA_CONCEPT" className="bg-slate-900">
                  Data Concept (content / genericDataConcepts)
                </option>
                <option value="VERIFICATION_KEY_PLANT" className="bg-slate-900">
                  Verification Keys Plant (keylibrary)
                </option>
                <option value="VERIFICATION_KEY_CUST" className="bg-slate-900">
                  Verification Keys Customer (keylibrary)
                </option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !previewContent}
              className="w-full rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Storing in Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Store in Database</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback-Meldungen */}
          {result?.id && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Successfully stored!</span>
              </div>
              <p className="font-mono text-slate-300 pt-1">
                UUID: <code className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-400">{result.id}</code>
              </p>
            </div>
          )}

          {result?.error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Error saving definition:</span>
                <p className="mt-0.5 text-slate-300 font-mono">{result.error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Rechte Seite: Vorschau-Box */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              File Preview
            </label>
            {selectedFileName && (
              <span className="text-[11px] font-mono text-indigo-400 truncate max-w-50" title={selectedFileName}>
                {selectedFileName}
              </span>
            )}
          </div>

          <div className="h-90 w-full bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] overflow-auto border border-slate-800/80 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
            {previewContent ? (
              <pre className="whitespace-pre-wrap break-all text-emerald-400/90">{previewContent}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                <FileCode className="w-8 h-8 stroke-1" />
                <span className="text-xs italic">Select an XML file to preview its content...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}