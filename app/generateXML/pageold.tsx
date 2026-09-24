"use client";

import React, { useState, useEffect } from "react";

// Go Backend URL
const GO_BACKEND_URL = "http://localhost:3010";

interface PublicKeyOption {
  index: number;
  name: string;
  validTo: string;
}

export default function KeyLibraryGenerator() {
  const [keys, setKeys] = useState<PublicKeyOption[]>([]);
  const [filename, setFilename] = useState("keyLibrary.xml");
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [fetchingKeys, setFetchingKeys] = useState(true);

  // 1. On page load: fetch available keys from the Go API
  useEffect(() => {
    async function fetchKeysFromGo() {
      try {
        const res = await fetch(`${GO_BACKEND_URL}/publickeys`);
        if (!res.ok) throw new Error("Error loading keys");
        
        const data: PublicKeyOption[] = await res.json();
        setKeys(data);
        if (data.length > 0) {
          setSelectedKeyIndex(data[0].index); // Select the first entry
        }
      } catch (err) {
        console.error("Go backend not reachable:", err);
      } finally {
        setFetchingKeys(false);
      }
    }

    fetchKeysFromGo();
  }, []);

  // 2. Request XML generation from the Go backend and download the file
  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKeyIndex) return;

    setLoading(true);

    try {
      const response = await fetch(`${GO_BACKEND_URL}/generate-xml`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: filename,
          keyIndex: Number(selectedKeyIndex),
        }),
      });

      if (!response.ok) {
        throw new Error("Error creating XML in the Go backend");
      }

      // Download the stream as a file in the browser
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const finalFilename = filename.endsWith(".xml") ? filename : `${filename}.xml`;
      a.download = finalFilename;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Fehler beim Generieren der XML über das Go Backend.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: "600px", margin: "50px auto", fontFamily: "sans-serif", padding: "20px" }}>
      <h2>KMS Key Library Generator</h2>
      <p style={{ color: "#666" }}>
        The keys are fetched and processed directly by the Go backend.
      </p>

      <form onSubmit={handleDownload} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "30px" }}>
        {/* Filename input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="filename" style={{ fontWeight: "bold" }}>Filename:</label>
          <input
            id="filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="e.g. myKeyLibrary.xml"
            required
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        {/* Dynamic dropdown from Go */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <label htmlFor="keySelect" style={{ fontWeight: "bold" }}>
            Public key selection (from Go backend):
          </label>
          {fetchingKeys ? (
            <p>Loading available keys from Go KMS...</p>
          ) : (
            <select
              id="keySelect"
              value={selectedKeyIndex}
              onChange={(e) => setSelectedKeyIndex(Number(e.target.value))}
              style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc", backgroundColor: "#fff" }}
            >
              {keys.map((k) => (
                <option key={k.index} value={k.index}>
                  {k.name} (Valid until: {k.validTo})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || fetchingKeys}
          style={{
            padding: "12px 20px",
            backgroundColor: loading || fetchingKeys ? "#ccc" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: loading || fetchingKeys ? "not-allowed" : "pointer",
            fontWeight: "bold",
            marginTop: "10px",
          }}
        >
          {loading ? "Generating XML in Go..." : "Download XML file"}
        </button>
      </form>
    </main>
  );
}