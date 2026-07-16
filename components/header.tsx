import Link from 'next/link';
import Image from 'next/image'


export default function Header() {
    return (
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-3 font-semibold">
              <Image src="/next.svg" alt="" width={89} height={18} priority/>  
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600">
              <Link href="/" className="hover:text-zinc-950">
                Home
              </Link>
              <Link href="/tagitems" className="hover:text-zinc-950">
                RFID Tag items
              </Link>
              <Link href="/rfidtags" className="hover:text-zinc-950">
                 New RFID Tag
              </Link>
            </nav>
          </header>
    );
}