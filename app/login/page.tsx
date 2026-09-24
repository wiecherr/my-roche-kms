"use client";

import Image from "next/image";
import { ShieldCheck, LogIn, Lock, KeyRound, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const accessDenied = searchParams.get("error") === "missing_role";

  const handleSSOLogin = () => {
    // Redirect user directly to the Go backend on port 3010
    window.location.href = "http://localhost:3010/api/auth/login"; 
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4">
      <div className="relative space-y-8">
        {/* Background Ambient Glow */}
        <div className="absolute -top-12 -right-12 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-60 w-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl shadow-inner">
            <Image
              src="/roche.png"
              alt="Roche Logo"
              width={80}
              height={40}
              priority
              /* Macht ein weißes/schwarzes PNG im Dark-Mode blau */
              className="h-8 w-auto object-contain brightness-0 invert-38 sepia-88 saturate-2000 hue-rotate-200deg"
            />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-wide text-white">
              AISQ Team Portal
            </h1>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Single Sign-On Authentication for Key Management System (KMS) & Cryptographic Services
            </p>
          </div>
        </div>

        {/* Security Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-[11px]">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="block text-slate-200 font-semibold">OAuth2 / OIDC</span>
              <span className="text-slate-500 text-[10px]">Roche Identity</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="truncate">
              <span className="block text-slate-200 font-semibold">TLS Encrypted</span>
              <span className="text-slate-500 text-[10px]">Secure Session</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="block text-slate-200 font-semibold">KMS Access</span>
              <span className="text-slate-500 text-[10px]">Hardware Tokens</span>
            </div>
          </div>
        </div>

        {/* Login Action Area */}
        <div className="pt-2 space-y-4">
      {accessDenied && (
      <div role="alert" className="border border-red-900/70 bg-red-950/40 px-4 py-3 text-center text-xs text-red-200">
        Error: You do not have the required role to view this webpage.
      </div>
      )}
          <button
            onClick={handleSSOLogin}
            type="button"
            className="w-full rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3.5 px-5 text-center text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in with Roche Single Sign-On (SSO)</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-3 border-t border-slate-800/80">
            <span className="flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              AISQ KMS v2026.1
            </span>
            <span>Internal Access Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}