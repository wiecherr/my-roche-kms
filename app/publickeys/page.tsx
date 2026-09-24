import Link from 'next/link'

// Erweitertes Interface für die XML-Definitionen (falls mit Name übergeben)
interface XmlDefinitionInfo {
  id: string;
  name: string;
  type?: string;
}

interface PublicKeyItem {
  id:                 string;
  publickey_name:     string;
  curve_type:         string; // NEU
  publickey_raw_x:    string;
  publickey_raw_y:    string;
  prodmasterkey_raw:  string;
  created_at:         string;
  // NEU: Falls Go direkt aufgelöste Objekte schickt
  xml_definitions?:   XmlDefinitionInfo[]; 
  // ODER Falls Go nur die Namen schickt:
  xml_definition_names?: string[];
  key_identifier?:     string; // Optional, falls vom Backend bereitgestellt
}

// Hilfsfunktion zum Abrufen der Daten vom Go-Backend
async function getPublicKeys(): Promise<PublicKeyItem[]> {
  try {
    const response = await fetch("http://localhost:3010/publickeys", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Error: An error occurred. ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("API-Error:", error);
    return [];
  }
}

export default async function PublicKeysPage() {
  const publickeyitems = await getPublicKeys();

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Derived Public Keys Overview
          </h1>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            Count: {publickeyitems.length}
          </span>
        </div>

        {publickeyitems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
            No public keys found in the database..
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
            {publickeyitems.slice(0, 50).map((item) => (
              <li key={item.id} className="p-4 hover:bg-zinc-50 transition-colors">
                <div className="flex flex-col gap-3">
                  
                  {/* Oberer Bereich: Name, Curve Badge & Details Button */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/publickeys/${item.id}`}
                          className="text-lg font-semibold text-zinc-900 hover:text-blue-600"
                        >
                          {item.publickey_name}
                        </Link>
                        
                        {/* NEU: Curve Type Badge */}
                        {item.curve_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {item.curve_type}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
                        <span className="flex items-center gap-1 font-medium text-zinc-700">
                          🕒 Created: {item.created_at}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-zinc-500">
                          ID: {item.id}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-zinc-500">
                          Key Identifier: {item.key_identifier} 
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/publickeys/${item.id}`}
                      className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
                    >
                      Details
                    </Link>
                  </div>

                  {/* NEU: Liste der angehängten XML Definitions */}
                  {((item.xml_definitions && item.xml_definitions.length > 0) || 
                    (item.xml_definition_names && item.xml_definition_names.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs font-medium text-zinc-500 mr-1">
                        XML Definitions:
                      </span>
                      
                      {/* Variante A: Wenn Go ein Array von Objekten schickt */}
                      {item.xml_definitions?.map((xml) => (
                        <span
                          key={xml.id || xml.name}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200"
                        >
                          📄 {xml.name}
                        </span>
                      ))}

                      {/* Variante B: Wenn Go nur ein Array von Strings (Namen) schickt */}
                      {!item.xml_definitions && item.xml_definition_names?.map((name, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200"
                        >
                          📄 {name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Raw Key Anzeige */}
                  {item.publickey_raw_x && (
                    <div className="mt-1 rounded-md bg-zinc-900 p-3 font-mono text-xs text-emerald-400 overflow-x-auto border border-zinc-800">
                      <div className="text-[10px] uppercase tracking-wider text-white mb-1 select-none">
                        Public Key (Raw Hex x):
                      </div>
                      <span className="break-all">{item.publickey_raw_x}</span>
                      
                      <div className="text-[10px] uppercase tracking-wider text-white mb-1 mt-2 select-none">
                        Public Key (Raw Hex y):
                      </div>
                      <span className="break-all">{item.publickey_raw_y}</span>
                      
                      <div className="text-[10px] uppercase tracking-wider text-white mb-1 mt-2 select-none">
                        Production Master Key (Raw Hex / Public Key Name):
                      </div>
                      <span className="break-all">{item.prodmasterkey_raw}</span>
                    </div>
                  )}

                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}