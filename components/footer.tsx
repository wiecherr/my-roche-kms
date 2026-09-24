import Image from "next/image";

export default function Footer() {
  return (
    <footer className="sticky bottom-0 z-30 flex h-12 items-center justify-between border-t border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 text-xs text-slate-400 sm:px-6">
      <div className="flex items-center gap-2">
        <Image
          src="/roche.png"
          alt="Roche Logo"
          width={40}
          height={20}
          className="h-5 w-auto object-contain"
        />
        <span>Roche 2026 AISQ Team</span>
      </div>

      <p>© 2026 Roche. All rights reserved.</p>
    </footer>
  );
}