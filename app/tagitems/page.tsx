
// Schnittstelle für TypeScript definieren

import Link from 'next/link'

export default async function RFIDKeyTagsPage() {
    const response = await fetch('http://localhost:3010/tagitems');
    const tagitems = await response.json();
     

    return (
        
        <div className="space-y-8">
            <section className="space-y-8">
                <h1 className="text-center text-4xl font-semibold text-zinc-950 sm:text-5xl">
                    RFID Tag Keys
                </h1>
                <ul className="space-y-3">
                    {tagitems.slice(0,10).map((tagitem) => (
                        <li key={tagitem.id}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <Link href={`/tagitems/${tagitem.id}`}
                                className="text-lg font-semibold text-zinc-950 hover:text-zinc-950">
                                        {"ID: " + tagitem.id + " B-ID: " + tagitem.batchid}
                                </Link>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}