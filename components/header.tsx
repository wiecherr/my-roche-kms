import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';

type HeaderItem = {
  href: string;
  label: string;
};

const specialistHeaderItems: HeaderItem[] = [
  { href: '/', label: 'Home' },
];

const userHeaderItems: HeaderItem[] = [
  { href: '/work-in-progress', label: 'Home' },
];

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default async function Header() {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get('access_token');
  const sessionRole = cookieStore.get('sso_session_role')?.value;

  if (!isAuthenticated) {
    return null;
  }

  const profileCookie = cookieStore.get('user_profile')?.value;
  let userProfile: { user_id?: string; email?: string; groups?: string[] } | null = null;

  if (profileCookie) {
    try {
      userProfile = JSON.parse(profileCookie) as { user_id?: string; email?: string; groups?: string[] };
    } catch {
      userProfile = null;
    }
  }

  const displayName = userProfile?.user_id || userProfile?.email || 'User';
	const headerItems = sessionRole === 'user' ? userHeaderItems : specialistHeaderItems;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">

      {/* TOP ROW: Top bar */}
      <div className="flex h-16 items-center justify-between px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image src="/next.svg" alt="Logo" width={95} height={20} priority className="invert" />
        </Link>
 
        {/* Action icons on the right */}
        <div className="flex items-center gap-2.5">
          {/* User Badge */}
          {userProfile && (
            <div 
              title={`Logged in as ${displayName}`}
              className="mr-1 flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs font-medium text-slate-300 shadow-inner"
            >
              <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className="max-w-37.5 truncate font-mono text-[11px] text-slate-200">{displayName}</span>
            </div>
          )}

          <a
            href="http://localhost:3010/api/auth/logout"
            aria-label="Logout"
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-800 hover:text-rose-400"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </a>

          {/* Settings Icon Button */}
          {sessionRole !== 'user' && <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-800 hover:text-blue-400"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>}
        </div>
      </div>      

      {/* HORIZONTAL DIVIDER */}
      <div className="h-px w-full bg-slate-800" />
 
      {/* SECOND ROW: Menu area */}
      <div className="flex h-12 items-center px-6 sm:px-8">
        <nav className="flex items-center gap-8 text-sm font-semibold text-slate-200">
          {headerItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-blue-400">
              {item.label}
            </Link>
          ))}

		  {sessionRole === 'specialist' && <>
          {/* Master Keys Dropdown */}
          <div className="group relative flex cursor-pointer items-center gap-1.5 py-3 transition-colors hover:text-blue-400">
            <span>Private Master Keys</span>
            <ChevronDownIcon className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-180 group-hover:text-blue-400" />
            
            <div className="absolute left-0 top-full hidden group-hover:block">
              <div className="w-56 rounded-b-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-lg">
                <Link href="/organizationalkeyitems" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Overview Org. AWS Master Keys
                </Link>              
                <Link href="/orgamasterkeys" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  New Org. AWS Master Key
                </Link>
              </div>
            </div>
          </div>

          {/* Derived Public Keys Dropdown */}
          <div className="group relative flex cursor-pointer items-center gap-1.5 py-3 transition-colors hover:text-blue-400">
            <span>Derived Public Keys</span>
            <ChevronDownIcon className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-180 group-hover:text-blue-400" />
            
            <div className="absolute left-0 top-full hidden group-hover:block">
              <div className="w-56 rounded-b-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-lg">
                <Link href="/newpublickeys" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  New Derived AWS Public Key Overview 
                </Link>
                <Link href="/newpublickeyitem" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  New Derived AWS Public Key 
                </Link>              
                <Link href="/reconstructkeypair" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  New Reconstruct existing Key Pairs
                </Link>            
              </div>
            </div>
          </div>

          {/* RFID Tags Dropdown */}
          <div className="group relative flex cursor-pointer items-center gap-1.5 py-3 transition-colors hover:text-blue-400">
            <span>RFID Tags</span>
            <ChevronDownIcon className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-180 group-hover:text-blue-400" />

            <div className="absolute left-0 top-full hidden group-hover:block">
              <div className="w-56 rounded-b-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-lg">
                <Link href="/tagitems" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  RFID Tag Items Overview
                </Link>
                <Link href="/rfidtags" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  New RFID Tag Item
                </Link>
              </div>
            </div>
          </div>

          {/* Key Packages Delivery Dropdown */}
          <div className="group relative flex cursor-pointer items-center gap-1.5 py-3 transition-colors hover:text-blue-400">
            <span>Key Packages Delivery</span>
            <ChevronDownIcon className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-180 group-hover:text-blue-400" />

            <div className="absolute left-0 top-full hidden group-hover:block">
              <div className="w-56 rounded-b-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-lg">
                <Link href="/mailforwardprod" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Mail Key Package Production Site
                </Link>
                <Link href="/mailforwardcust" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Mail Key Package Production Customer
                </Link>
                <Link href="/xmldefinitionitem" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  XML Definitions Upload
                </Link>
                <Link href="/xmldefinitions" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  XML Definitions Overview
                </Link>
                <Link href="/NewVerfication" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Verification Scenario
                </Link>
                <Link href="/live-simulator" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Simulator Scenario
                </Link>
              </div>
            </div>
          </div>

          {/* Plants/Customer Dropdown */}
          <div className="group relative flex cursor-pointer items-center gap-1.5 py-3 transition-colors hover:text-blue-400">
            <span>Plants/Customer</span>
            <ChevronDownIcon className="h-4 w-4 text-slate-400 transition-transform group-hover:rotate-180 group-hover:text-blue-400" />

            <div className="absolute left-0 top-full hidden group-hover:block">
              <div className="w-56 rounded-b-xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-lg">
                <Link href="/plants" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Plants Overview
                </Link>
                <Link href="/plant" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  New Plant
                </Link>
                <Link href="/customers" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  Customer Overview
                </Link>
                <Link href="/customer" className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                  New Customer
                </Link>
              </div>
            </div>
          </div>
		  </>}
        </nav>
      </div>
    </header>
  );
}