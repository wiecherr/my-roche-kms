type PostPageProps = {
    params: Promise<{id: string}>;
}


export default async function PostPage({params}: PostPageProps) {
    const {id} = await params;
     const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`,);
    const post = await response.json();
     

    return (
        
        
            <article className="space-y-6">
                <div className="space-y-4">
                    <h1 className="text-center text-4xl font-semibold text-zinc-950 sm:text-5xl">
                        {post.title.charAt(0).toUpperCase() + post.title.slice(1)}
                    </h1>
                    <p className="text-lg leading-8 text-zinc-700">
                        {post.body}
                    </p>
                </div>
            </article>
    
    );
}