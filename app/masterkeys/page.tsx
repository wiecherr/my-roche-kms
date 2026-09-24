import Link from 'next/link'

interface MasterKeyItem {
  id:              string;
  masterkey_name:  string;
  masterkey_raw:   string;
  created_at:      string;
  curve_type:      string;
}

// Helper function to fetch data from the Go backend
async function getMasterKeys(): Promise<MasterKeyItem[]> {
  try {
    // URL of your Go/Gin API (e.g. localhost:8080)
    const response = await fetch("http://localhost:3010/masterkeys", {
      cache: "no-store", // Prevent caching so new keys appear immediately
    });

    if (!response.ok) {
      throw new Error(`Error while loading: ${response.statusText}`);
    }

    const data = await response.json();

    // Safety net: if the API sends null instead of [],
    // make sure we always return an array.
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("API error:", error);
    return []; // Fallback to an empty array on connection errors
  }
}



export default async function MasterKeysPage() {
    //const response = await fetch('http://localhost:3010/masterkeys');
    //const masterkeyitems: MasterKeyItem[] = await response.json();
    
    const masterkeyitems = await getMasterKeys();

    return (
<div className="mx-auto max-w-4xl p-6 space-y-8">
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Overview Private Global Master Keys
          </h1>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            Count: {masterkeyitems.length}
          </span>
        </div>

        {masterkeyitems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
            No private master keys found!
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white shadow-sm">
            {masterkeyitems.slice(0, 50).map((item) => (
              <li key={item.id} className="p-4 hover:bg-zinc-50 transition-colors">
                <div className="flex flex-col gap-3">
                  {/* Top area: name, timestamp and ID */}
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/masterkeys/${item.id}`}
                        className="text-lg font-semibold text-zinc-900 hover:text-blue-600"
                      >
                        {item.masterkey_name}
                      </Link>
                         {/* NEW: Curve type badge */}
                        {item.curve_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {item.curve_type}
                          </span>
                        )}                     
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        {/* NEW: timestamp display */}
                        <span className="flex items-center gap-1 font-medium text-zinc-600">
                          🕒 Created: {item.created_at}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-zinc-400">
                          ID: {item.id}
                        </span>
                      </div>


                    </div>

                    <Link
                      href={`/masterkeys/${item.id}`}
                      className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
                    >
                      Details
                    </Link>
                  </div>

                  {/* Raw key display */}
                  {item.masterkey_raw && (
                    <div className="mt-1 rounded-md bg-zinc-900 p-3 font-mono text-xs text-emerald-400 overflow-x-auto border border-zinc-800">
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 select-none">
                        Master Key (Raw Hex / Payload):
                      </div>
                      <span className="break-all">{item.masterkey_raw}</span>
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