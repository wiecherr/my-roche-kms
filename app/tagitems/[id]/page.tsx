type PostPageProps = {
    params: Promise<{id: string}>;
}


export default async function TagItemPage({params}: PostPageProps) {
    const {id} = await params;
     const response = await fetch(`http://localhost:3010/tagitems/${id}`,);
    const tagitem = await response.json();
     

    return (
        
        
            <article className="space-y-6">
                <div className="space-y-4">
                    <h1 className="text-center text-4xl font-semibold text-zinc-950 sm:text-5xl">
                        {"ID: "+tagitem.id}
                    </h1>
                    <p className="text-lg leading-8 text-zinc-700">
                        {"MasterKey: " + tagitem.masterkey}
                    </p>
                    <p className="text-lg leading-8 text-zinc-700">
                        {"UID: " + tagitem.uid}
                    </p>
                     <p className="text-lg leading-8 text-zinc-700">
                        {"Batch ID: " + tagitem.batchid}
                    </p>
                    <p className="text-lg leading-8 text-zinc-700">
                        {"RFID Tag Key: " + tagitem.rfidtagkey}
                    </p>
                </div>
            </article>
    
    );
}