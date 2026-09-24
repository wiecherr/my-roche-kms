"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MasterKeyOption {
  id: string;
  masterkey_name: string;
}

interface XmlDefinition {
  id: string;
  name: string;
  type: "SECURITY_DEFINITION" | "DATA_CONCEPT";
  file_signature?: string;
}

const HARDCODED_CURVETYPES = [
  { curvetype: "secp256r1", curve_description: "Standards for Efficient Cryptography - SEC 2, 256-bit Random Prime Curve" },
  { curvetype: "secp128r1", curve_description: "Standards for Efficient Cryptography - SEC 2, 128-bit Random Prime Curve" },
  { curvetype: "ed25519", curve_description: "Edwards-curve Digital Signature Algorithm over Curve25519" },
];

export default function NewDerivedKeyPage() {
  const router = useRouter();

  // Daten für die Dropdowns
  const [masterKeys, setMasterKeys] = useState<MasterKeyOption[]>([]);
  const [loadingMasterKeys, setLoadingMasterKeys] = useState(true);

  // XML Definitionen States
  const [xmlDefinitions, setXmlDefinitions] = useState<XmlDefinition[]>([]);
  const [loadingXml, setLoadingXml] = useState(true);

  // Formular-Zustände
  const [selectedMasterKeyId, setSelectedMasterKeyId] = useState("");
  const [derivedKeyName, setDerivedKeyName] = useState("");
  const [selectedCurveType, setSelectedCurveType] = useState<string>(HARDCODED_CURVETYPES[0].curvetype);

  // Zuweisung aller XML-Definitionen in EINEM flachen Array
  const [selectedXmlIds, setSelectedXmlIds] = useState<string[]>([]);
  const [xmlSearch, setXmlSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Masterkeys und XML-Definitionen initial vom Backend laden
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Masterkeys laden
        const resKeys = await fetch("http://localhost:3010/masterkeys");
        if (resKeys.ok) {
          const dataKeys = await resKeys.json();
          const keysArray = Array.isArray(dataKeys) ? dataKeys : [];
          setMasterKeys(keysArray);
          if (keysArray.length > 0) setSelectedMasterKeyId(keysArray[0].id);
        }

        // XML Definitions laden
        const resXml = await fetch("http://localhost:3010/xmldefinitionspk");
        if (resXml.ok) {
          const dataXml = await resXml.json();
          setXmlDefinitions(Array.isArray(dataXml) ? dataXml : []);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Formulardaten:", err);
        setError("Could not load master keys or XML definitions.");
      } finally {
        setLoadingMasterKeys(false);
        setLoadingXml(false);
      }
    }

    loadInitialData();
  }, []);

  // Live-Filterung unabhängig vom Typ (nach Name, ID oder Typ-Bezeichnung)
  const filteredXmls = xmlDefinitions.filter(
    (xml) =>
      xml.name.toLowerCase().includes(xmlSearch.toLowerCase()) ||
      xml.id.toLowerCase().includes(xmlSearch.toLowerCase()) ||
      xml.type.toLowerCase().includes(xmlSearch.toLowerCase())
  );

  // Checkbox Toggle-Handler für das flache Array
  const toggleXmlSelection = (id: string) => {
    setSelectedXmlIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 2. Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!selectedMasterKeyId) {
      setError("Please select a global master key");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:3010/derivedpublickey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedMasterKeyId,
          publickey_name: derivedKeyName,
          curvetype: selectedCurveType,
          derivation_path: "",
          // Übergebe das flache Array aller ausgewählten XML-UUIDs
          xml_definition_ids: selectedXmlIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Failed to create (${response.status})`);
      }

      router.push("/publickeys");
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to derive key:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <Link href="/publickeys" className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors">
            ← Back to overview
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl mt-1">
            Create new derived Public Key
          </h1>
          <p className="text-sm text-zinc-500">
            Select the private master key, name your key, and attach XML definitions.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 text-sm text-red-700">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-zinc-200 shadow-sm">
        
        {/* Dropdown: Global Master Key */}
        <div className="space-y-2">
          <label htmlFor="masterKeySelect" className="block text-sm font-medium text-zinc-700">
            Global Private Master Key selection
          </label>
          
          {loadingMasterKeys ? (
            <div className="h-10 w-full animate-pulse rounded-md bg-zinc-100 border border-zinc-200" />
          ) : (
            <select
              id="masterKeySelect"
              value={selectedMasterKeyId}
              onChange={(e) => setSelectedMasterKeyId(e.target.value)}
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              {masterKeys.length === 0 ? (
                <option value="" disabled>No Master Key Found</option>
              ) : (
                masterKeys.map((mk) => (
                  <option key={mk.id} value={mk.id}>
                    {mk.masterkey_name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {/* Feld: Derived Key Name */}
        <div className="space-y-2">
          <label htmlFor="derivedKeyName" className="block text-sm font-medium text-zinc-700">
            Name for the new derived Public Key (key Pair)
          </label>
          <input
            id="derivedKeyName"
            type="text"
            required
            placeholder="e.g. Derived Public Key Zone A-1"
            value={derivedKeyName}
            onChange={(e) => setDerivedKeyName(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* Dropdown: Curve Type */}
        <div className="space-y-2">
          <label htmlFor="curvetype" className="block text-sm font-medium text-zinc-700">
            Curve Type:
          </label>
          <select
            id="curvetype"
            value={selectedCurveType}
            onChange={(e) => setSelectedCurveType(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            required
          >
            {HARDCODED_CURVETYPES.map((b) => (
              <option key={b.curvetype} value={b.curvetype}>
                {b.curvetype} — {b.curve_description}
              </option>
            ))}
          </select>
        </div>

        <hr className="border-zinc-200 my-4" />

        {/* UNIVERSELLE XML-DEFINITIONEN SEKTION */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-zinc-800">
              Attach XML Definitions ({selectedXmlIds.length} selected)
            </label>
            {selectedXmlIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedXmlIds([])}
                className="text-xs text-red-600 hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>

          {/* Suchfeld */}
          <input
            type="text"
            placeholder="Filter XML definitions by name, type, or UUID..."
            value={xmlSearch}
            onChange={(e) => setXmlSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />

          {/* Universelle XML-Auswahlliste */}
          <div className="max-h-52 overflow-y-auto border border-zinc-200 rounded-md p-2 space-y-1 bg-zinc-50">
            {loadingXml ? (
              <p className="text-xs text-zinc-400 italic">Loading XML definitions...</p>
            ) : filteredXmls.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No matching XML definitions found.</p>
            ) : (
              filteredXmls.map((xml) => (
                <label
                  key={xml.id}
                  className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer text-xs transition-colors border border-transparent hover:border-zinc-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedXmlIds.includes(xml.id)}
                    onChange={() => toggleXmlSelection(xml.id)}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 h-4 w-4"
                  />

                  {/* Name und UUID */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-900 truncate">{xml.name}</div>
                    <div className="text-zinc-400 font-mono text-[10px]">{xml.id}</div>
                  </div>

                  {/* Typ-Badge für schnelle visuelle Orientierung */}
                  <div className="shrink-0">
                    {xml.type === "SECURITY_DEFINITION" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        Security Def
                      </span>
                    ) : xml.type === "DATA_CONCEPT" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Data Concept
                      </span>
                    )  : null}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <Link
            href="/derived-keys"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading || masterKeys.length === 0}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Deriving..." : "Derive Public Key"}
          </button>
        </div>
      </form>
    </div>
  );
}