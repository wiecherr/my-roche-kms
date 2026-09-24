"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  KeyRound, 
  ArrowLeft, 
  FileCode2, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle,
  Upload,
  Search,
  Check,
  Cpu,
  Calendar
} from "lucide-react";

interface XmlDefinition {
  id: string;
  name: string;
  type: "SECURITY_DEFINITION" | "DATA_CONCEPT";
  file_signature?: string;
}

const HARDCODED_CURVETYPES = [
  { curvetype: "secp128r1", curve_description: "Standards for Efficient Cryptography - SEC 2, 128-bit Random Prime Curve" },
];

export default function CreateExistingKeyPage() {
  const router = useRouter();

  // REF FÜR AUTO-SCROLL ZU DEN PARSED KEYS
  const hexKeysRef = useRef<HTMLDivElement | null>(null);

  // XML Definitionen States
  const [xmlDefinitions, setXmlDefinitions] = useState<XmlDefinition[]>([]);
  const [loadingXml, setLoadingXml] = useState<boolean>(true);

  // Formular-Zustände
  const [publicKeyName, setPublicKeyName] = useState<string>("");
  const [selectedCurveType, setSelectedCurveType] = useState<string>(HARDCODED_CURVETYPES[0].curvetype);
  const [publicKeyRawX, setPublicKeyRawX] = useState<string>("");
  const [publicKeyRawY, setPublicKeyRawY] = useState<string>("");
  const [prodMasterKeyRaw, setProdMasterKeyRaw] = useState<string>("");

  // State für Gültigkeitsdatum (Standard: 5 Jahre ab heute)
  const getDefaultValidToDate = (yearsToAdd: number = 5) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + yearsToAdd);
    return d.toISOString().split("T")[0];
  };

  const [validToDate, setValidToDate] = useState<string>(getDefaultValidToDate(5));

  // UI-Zustände für ASN.1 Parsing & XML Auswählen
  const [parsingKey, setParsingKey] = useState<boolean>(false);
  const [selectedXmlIds, setSelectedXmlIds] = useState<string[]>([]);
  const [xmlSearch, setXmlSearch] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // AUTOMATISCHES SCROLLEN ZU DEN GEPARSTEN HEX-KEYS
  useEffect(() => {
    if ((publicKeyRawX || publicKeyRawY) && hexKeysRef.current) {
      const timer = setTimeout(() => {
        hexKeysRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [publicKeyRawX, publicKeyRawY]);

  // XML-Definitionen kaskadenfrei laden
  useEffect(() => {
    let isMounted = true;

    async function loadXmlDefinitions() {
      try {
        const resXml = await fetch("http://localhost:3010/xmldefinitionspk", { cache: "no-store" });
        if (resXml.ok) {
          const dataXml = await resXml.json();
          if (isMounted) {
            setXmlDefinitions(Array.isArray(dataXml) ? dataXml : []);
          }
        }
      } catch (err) {
        console.error("Fehler beim Laden der XML-Definitionen:", err);
        if (isMounted) {
          setError("Could not load XML definitions from backend.");
        }
      } finally {
        if (isMounted) {
          setLoadingXml(false);
        }
      }
    }

    loadXmlDefinitions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handler: XML-Datei an Go Backend senden & ASN.1 Schlüssel extrahieren lassen
  const handleXmlFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingKey(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("curvetype", selectedCurveType);

    try {
      const response = await fetch("http://localhost:3010/parse-asn1-key", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Failed to parse ASN.1 key from XML file");
      }

      const data = await response.json();
      
      if (data.publickey_raw_x) setPublicKeyRawX(data.publickey_raw_x);
      if (data.publickey_raw_y) setPublicKeyRawY(data.publickey_raw_y);
      if (data.prodmasterkey_raw) setProdMasterKeyRaw(data.prodmasterkey_raw);
      if (data.curvetype) setSelectedCurveType(data.curvetype);

    } catch (err: unknown) {
      console.error("ASN.1 Parsing Error:", err);
      setError(err instanceof Error ? err.message : "Error parsing ASN.1 structure from file.");
      setPublicKeyRawX("");
      setPublicKeyRawY("");
      setProdMasterKeyRaw("");
    } finally {
      setParsingKey(false);
    }
  };

  const toggleXmlSelection = (id: string) => {
    setSelectedXmlIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3010/newexistingpublickey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publickey_name: publicKeyName,
          curvetype: selectedCurveType,
          publickey_raw_x: publicKeyRawX,
          publickey_raw_y: publicKeyRawY,
          prodmasterkey_raw: prodMasterKeyRaw,
          xml_definition_ids: selectedXmlIds,
          valid_to: validToDate ? new Date(validToDate).toISOString() : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to register key (${response.status})`);
      }

      router.push("/newpublickeys");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const filteredXmls = xmlDefinitions.filter(
    (xml) =>
      xml.name.toLowerCase().includes(xmlSearch.toLowerCase()) ||
      xml.id.toLowerCase().includes(xmlSearch.toLowerCase()) ||
      xml.type.toLowerCase().includes(xmlSearch.toLowerCase())
  );

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
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Register Existing Public Key</h1>
            <p className="text-xs text-slate-400">
              Upload an XML file containing ASN.1 key structures to automatically extract coordinates or enter them manually
            </p>
          </div>
        </div>
      </div>

      {/* Benachrichtigung bei Fehlern */}
      {error && (
        <div className="w-full p-4 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-400 flex items-start gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Formular-Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Public Key Name */}
        <div className="space-y-2">
          <label htmlFor="publicKeyName" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            Public Key Name / Designation
          </label>
          <input
            id="publicKeyName"
            type="text"
            required
            placeholder="e.g. Pre-existing Public Key Plant B"
            value={publicKeyName}
            onChange={(e) => setPublicKeyName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-sans text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Grid: Curve Type & Expiration Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Curve Type Dropdown */}
          <div className="space-y-2">
            <label htmlFor="curvetype" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Curve Type
            </label>
            <select
              id="curvetype"
              value={selectedCurveType}
              onChange={(e) => setSelectedCurveType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              required
            >
              {HARDCODED_CURVETYPES.map((b) => (
                <option key={b.curvetype} value={b.curvetype} className="bg-slate-900 text-slate-200">
                  {b.curvetype} — {b.curve_description}
                </option>
              ))}
            </select>
          </div>

          {/* Expiration Date Field */}
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer color-scheme-dark"
              />
              
              {/* Preset Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500">Presets:</span>
                <button
                  type="button"
                  onClick={() => setValidToDate(getDefaultValidToDate(1))}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  +1 Year
                </button>
                <button
                  type="button"
                  onClick={() => setValidToDate(getDefaultValidToDate(3))}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  +3 Years
                </button>
                <button
                  type="button"
                  onClick={() => setValidToDate(getDefaultValidToDate(5))}
                  className="px-2 py-0.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-amber-400/90 transition-all cursor-pointer"
                >
                  +5 Years
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Derivation Pipeline Parameters Preview Box */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-indigo-400 font-sans font-semibold">
            <Cpu className="w-4 h-4" />
            <span>Derivation Pipeline Parameters</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1">
            <div>
              <span className="text-slate-500 block">Curve Length:</span>
              <span className="text-emerald-400 font-mono">{selectedCurveType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Key Identifier:</span>
              <span className="text-amber-400 font-mono">Manual / ASN.1 Parsed</span>
            </div>
            <div>
              <span className="text-slate-500 block">Expiration:</span>
              <span className="text-slate-300 font-mono">{validToDate || "No Limit"}</span>
            </div>
          </div>
        </div>

        <hr className="border-slate-800 my-4" />

        {/* RAW KEYS SEKTION MIT XML/ASN.1 IMPORT & SCROLL-REF */}
        <div ref={hexKeysRef} className="space-y-4 scroll-mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              Raw Public Key Data (Hex)
            </h2>
            
            {/* ASN.1 XML UPLOAD BUTTON */}
            <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 transition-all">
              {parsingKey ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing ASN.1 Key...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Parse Key from XML (ASN.1)</span>
                </>
              )}
              <input
                type="file"
                accept=".xml"
                onChange={handleXmlFileSelect}
                disabled={parsingKey}
                className="hidden"
              />
            </label>
          </div>

          {/* Raw Hex X */}
          <div className="space-y-1.5">
            <label htmlFor="rawX" className="block text-xs text-slate-400 font-mono">
              Public Key Raw Hex (X Coordinate)
            </label>
            <input
              id="rawX"
              type="text"
              required
              placeholder="Auto-extracted or manual 04A1B2..."
              value={publicKeyRawX}
              onChange={(e) => setPublicKeyRawX(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-emerald-400 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Raw Hex Y */}
          <div className="space-y-1.5">
            <label htmlFor="rawY" className="block text-xs text-slate-400 font-mono">
              Public Key Raw Hex (Y Coordinate)
            </label>
            <input
              id="rawY"
              type="text"
              required
              placeholder="Auto-extracted or manual 05E6F7..."
              value={publicKeyRawY}
              onChange={(e) => setPublicKeyRawY(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-emerald-400 placeholder-slate-700 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Production Master Key Raw */}
          <div className="space-y-1.5">
            <label htmlFor="prodMaster" className="block text-xs text-slate-400 font-mono">
              Production Master Key Raw (Optional)
            </label>
            <input
              id="prodMaster"
              type="text"
              placeholder="Auto-extracted or manual 887766..."
              value={prodMasterKeyRaw}
              onChange={(e) => setProdMasterKeyRaw(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-amber-400 placeholder-slate-700 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        <hr className="border-slate-800 my-4" />

        {/* XML-DEFINITIONEN ANHÄNGEN */}
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

          <div className="max-h-52 overflow-y-auto border border-slate-800 rounded-xl p-2 space-y-1 bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
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
                      {isChecked && <Check className="w-3 h-3 stroke-3" />}
                    </div>

                    {/* Name und UUID */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs text-slate-200 truncate">{xml.name}</div>
                      <div className="text-slate-500 font-mono text-[10px]">{xml.id}</div>
                    </div>

                    {/* Typ-Badge */}
                    <div className="shrink-0">
                      {xml.type === "SECURITY_DEFINITION" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Security Def
                        </span>
                      ) : xml.type === "DATA_CONCEPT" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Data Concept
                        </span>
                      ) : null}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link 
            href="/publickeys" 
            className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Registering Key...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Register Public Key</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}