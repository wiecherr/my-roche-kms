"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  KeyRound, 
  Key, 
  Tag, 
  Factory, 
  Building2, 
  FileCode, 
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Cpu
} from "lucide-react";

interface DashboardMetrics {
  masterKeysCount: number;
  keyPairsCount: number;
  rfidTagsCount: number;
  plantsCount: number;
  customersCount: number;
  xmlDefsCount: number;
}

export default function Home() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    masterKeysCount: 0,
    keyPairsCount: 0,
    rfidTagsCount: 0,
    plantsCount: 0,
    customersCount: 0,
    xmlDefsCount: 0,
  });

  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(true);

  // Load all entity counters in parallel from the Go backend
  useEffect(() => {
    let isMounted = true;

    async function fetchMetrics() {
      try {
        setLoadingMetrics(true);

        const [resMaster, resPairs, resTags, resPlants, resCustomers, resXml] = await Promise.allSettled([
          fetch("http://localhost:3010/aws-masterkeys", { cache: "no-store" }),
          fetch("http://localhost:3010/getawspublickeys", { cache: "no-store" }),
          fetch("http://localhost:3010/tagitems", { cache: "no-store" }),
          fetch("http://localhost:3010/plants", { cache: "no-store" }),
          fetch("http://localhost:3010/customers", { cache: "no-store" }),
          fetch("http://localhost:3010/xmldefinitions", { cache: "no-store" }),
        ]);

        const getLength = async (res: PromiseSettledResult<Response>) => {
          if (res.status === "fulfilled" && res.value.ok) {
            const data = await res.value.json().catch(() => []);
            return Array.isArray(data) ? data.length : 0;
          }
          return 0;
        };

        const [
          masterKeysCount,
          keyPairsCount,
          rfidTagsCount,
          plantsCount,
          customersCount,
          xmlDefsCount
        ] = await Promise.all([
          getLength(resMaster),
          getLength(resPairs),
          getLength(resTags),
          getLength(resPlants),
          getLength(resCustomers),
          getLength(resXml)
        ]);

        if (isMounted) {
          setMetrics({
            masterKeysCount,
            keyPairsCount,
            rfidTagsCount,
            plantsCount,
            customersCount,
            xmlDefsCount,
          });
        }
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        if (isMounted) setLoadingMetrics(false);
      }
    }

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      
      {/* Header with centered KMS logo GIF */}
      <header className="text-center space-y-4 flex flex-col items-center">
        <div className="flex justify-center my-2">
          <Image
            src="/Logo KMS.gif"
            alt="KMS Logo"
            width={160}
            height={160}
            unoptimized // Preserve the GIF animation
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
          RFID Key Management System
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
          Control Plane for Batch Processing, Key Provisioning & NXP Chip Personalization
        </p>
      </header>

      {/* NEW METRICS DASHBOARD (WIDGETS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide">
              KMS System Telemetry & Entity Overview
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
            {loadingMetrics ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                <span>Refreshing...</span>
              </>
            ) : (
              <span className="text-emerald-500 font-medium">● Live Sync</span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          {/* Widget 1: AWS Master Keys */}
          <Link href="/organizationalkeyitems" className="group">
            <div className="p-4 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800/80 hover:border-blue-500/50 transition-all relative overflow-hidden flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 block">
                  {loadingMetrics ? "-" : metrics.masterKeysCount}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block truncate">
                  AWS Master Keys
                </span>
              </div>
            </div>
          </Link>

          {/* Widget 2: Derived Key Pairs */}
          <Link href="/newpublickeys" className="group">
            <div className="p-4 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800/80 hover:border-indigo-500/50 transition-all relative overflow-hidden flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <Key className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 block">
                  {loadingMetrics ? "-" : metrics.keyPairsCount}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block truncate">
                  Derived Key Pairs
                </span>
              </div>
            </div>
          </Link>

          {/* Widget 3: Signed RFID Tags */}
          <Link href="/tagitems" className="group">
            <div className="p-4 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800/80 hover:border-emerald-500/50 transition-all relative overflow-hidden flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Tag className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 block">
                  {loadingMetrics ? "-" : metrics.rfidTagsCount}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block truncate">
                  Signed RFID Tags
                </span>
              </div>
            </div>
          </Link>

          {/* Widget 4: Production Plants */}
          <Link href="/plants" className="group">
            <div className="p-4 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800/80 hover:border-amber-500/50 transition-all relative overflow-hidden flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Factory className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 block">
                  {loadingMetrics ? "-" : metrics.plantsCount}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block truncate">
                  Target Plants
                </span>
              </div>
            </div>
          </Link>

          {/* Widget 5: Customers */}
          <Link href="/customers" className="group">
            <div className="p-4 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800/80 hover:border-purple-500/50 transition-all relative overflow-hidden flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <Building2 className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 block">
                  {loadingMetrics ? "-" : metrics.customersCount}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block truncate">
                  Customers
                </span>
              </div>
            </div>
          </Link>

          {/* Widget 6: XML Definitions */}
          <Link href="/xmldefinitions" className="group">
            <div className="p-4 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800/80 hover:border-rose-500/50 transition-all relative overflow-hidden flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <FileCode className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
              </div>
              <div>
                <span className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50 block">
                  {loadingMetrics ? "-" : metrics.xmlDefsCount}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block truncate">
                  XML Definitions
                </span>
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* Architecture highlights (5 pillars) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Karte 1 */}
        <div className="flex flex-col justify-between p-5 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              Maximum Separation of Duties
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              The web frontend operates purely as a Control Plane for process orchestration, 
              batch management, and status monitoring. All cryptographic operations (key generation, 
              derivation, and formatting) run strictly isolated within the Go Crypto Core (Data Plane). 
              The frontend never has direct access to cryptographic material at any point.
            </p>
          </div>
        </div>

        {/* Karte 2 */}
        <div className="flex flex-col justify-between p-5 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              Secure Persistent Key Storage
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Derived key pairs (public/private keys) are not generated dynamically on-the-fly; instead, 
              they are generated once by the Go Crypto Core and stored securely in the PostgreSQL database.
              Access Control: Private keys are saved with encryption-at-rest within the database.
              Traceability & Signatures: Chip metadata (UID, BatchID) is persisted alongside the derived key material and 
              its corresponding signature components (R, S) for auditability and verification.
            </p>
          </div>
        </div>

        {/* Karte 3 */}
        <div className="flex flex-col justify-between p-5 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              Enterprise SSO & Memory Protection
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              API endpoints are seamlessly secured using JSON Web Tokens (JWT) via OpenID Connect (OIDC). 
              During ephemeral in-memory operations within the Go backend, sensitive key material is 
              protected against memory leaks using hardened memory handling (explicit zeroing of memory 
              buffers immediately after execution).
            </p>
          </div>
        </div>

        {/* Karte 4 */}
        <div className="flex flex-col justify-between p-5 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              Scalable Cloud-Native Infrastructure
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Full containerization of all microservices via Docker and orchestration through Docker Compose 
              ensures consistent, platform-independent deployments and minimal latencies during high-volume NXP chip 
              personalization.
            </p>
          </div>
        </div>

        {/* NEW Karte 5: Offset Cryptography Pipeline (Spans 2 columns on medium screens) */}
        <div className="md:col-span-2 flex flex-col justify-between p-5 border border-zinc-200 rounded-xl bg-white shadow-xs dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                Masked Offset Cryptography Pipeline
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-600 dark:text-zinc-400 pt-2">
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-900 dark:text-zinc-200 block">
                  1. AWS HSM Key Derivation (x_derived)
                </span>
                <p>
                  Ed25519 signs a static blob via KMS HSM, followed by SHA-512 and RFC 8032 bit-clamping. 
                  ECDSA (secp256r1 & secp128r1) decrypts a static blob via KMS, reducing it via SHA-256 modulo N: 
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded ml-1 font-mono">x_derived = SHA256(plain) mod N</code>.
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-900 dark:text-zinc-200 block">
                  2. Static Master Key & Delta Offset (P_master & Δx)
                </span>
                <p>
                  Computes static trust anchor <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">P_master = x_derived * G</code>. 
                  A random seed generates <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">x_batch</code>, storing only the offset: 
                  <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">Δx = (x_derived - x_batch) mod N</code>.
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-900 dark:text-zinc-200 block">
                  3. Dynamic Re-Assembly & Tag Signing
                </span>
                <p>
                  Reconstructs private key <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">d_static = (x_batch + Δx) mod N</code> on-the-fly. 
                  Generates ECDSA signature components (R, S) over <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">SHA256(UID || BatchID)</code> with BIP-62 Low-S normalization.
                </p>
              </div>
              <div className="space-y-1.5">
                <span className="font-semibold text-zinc-900 dark:text-zinc-200 block">
                  4. Customer Offline Verification
                </span>
                <p>
                  Offline plants evaluate <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">(X_v, Y_v) = u1*G + u2*P_master</code>. 
                  Signatures validate offline if <code className="text-xs bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded font-mono">v = X_v mod N</code> equals R, fully decoupled from raw master private keys.
                </p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Zentrierte Gesamt-Architektur Grafik */}
      <section className="border border-zinc-200 rounded-xl bg-white p-6 shadow-xs dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
        <h2 className="text-center font-semibold text-xl text-zinc-900 dark:text-zinc-100">
          System Architecture Overview
        </h2>
        <div className="flex justify-center items-center">
          <Image
            src="/archirectv2.png"
            alt="KMS System Architecture Overview"
            width={900}
            height={500}
            className="rounded-lg object-contain w-full h-auto"
          />
        </div>
      </section>
    </div>
  );
}