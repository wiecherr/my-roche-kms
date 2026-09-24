"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  KeyRound, 
  UserCheck, 
  ArrowLeft, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileKey,
  Cpu
} from "lucide-react";

// Updated interface aligned with the /getawspublickeys endpoint
interface DerivedKeyPairItem {
  id: string;
  derived_key_pair_name: string;
  key_identifier: string;
  curve_type: string;
  aws_organizational_name?: string;
  aws_alias_name?: string;
  aws_master_key_arn?: string;
  masterkey_chipper_blob?: string;
  key_origin?: "AWS_KMS_DERIVED" | "RECONSTRUCTED_ASN1" | string;
}

interface CustomerItem {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_sign_pubkey: string;
  created_at: string;
}

export default function CreateMailForwardCustomerPage() {
  const router = useRouter();

  // States
  const [publicKeys, setPublicKeys] = useState<DerivedKeyPairItem[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState<boolean>(true);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form values
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Load AWS public keys from the Go/Gin API (/getawspublickeys)
  useEffect(() => {
    let isMounted = true;

    async function fetchPublicKeys() {
      try {
        setLoadingKeys(true);
        const keysRes = await fetch("http://localhost:3010/getawspublickeys", { cache: "no-store" });
        if (!keysRes.ok) {
          throw new Error("Could not load derived key pairs from KMS");
        }
        
        const keysData = await keysRes.json();
        const validKeys: DerivedKeyPairItem[] = Array.isArray(keysData) ? keysData : [];
        
        if (isMounted) {
          setPublicKeys(validKeys);
          if (validKeys.length > 0) {
            setSelectedKeyId(validKeys[0].id);
          }
        }
      } catch (err: unknown) {
        console.error("Error during loading Public Keys", err);
        if (isMounted) {
          setMessage({ type: "error", text: "Public Keys could not be loaded from the KMS" });
        }
      } finally {
        if (isMounted) {
          setLoadingKeys(false);
        }
      }
    }

    fetchPublicKeys();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load customers from the Go/Gin API
  useEffect(() => {
    let isMounted = true;

    async function fetchCustomers() {
      try {
        setLoadingCustomers(true);
        const customersRes = await fetch("http://localhost:3010/customers", { cache: "no-store" });
        if (!customersRes.ok) {
          throw new Error("Could not load customers from server");
        }
        
        const customersData = await customersRes.json();
        const validCustomers: CustomerItem[] = Array.isArray(customersData) ? customersData : [];
        
        if (isMounted) {
          setCustomers(validCustomers);
          if (validCustomers.length > 0) {
            setSelectedCustomerId(validCustomers[0].id);
          }
        }
      } catch (err: unknown) {
        console.error("Error during loading Customers", err);
        if (isMounted) {
          setMessage({ type: "error", text: "Customers could not be loaded from the KMS" });
        }
      } finally {
        if (isMounted) {
          setLoadingCustomers(false);
        }
      }
    }

    fetchCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const isLoading = loadingKeys || loadingCustomers;

  // Currently selected key for the metrics box
  const selectedKey = publicKeys.find((k) => k.id === selectedKeyId);
  const isAsn1Reconstructed = selectedKey
    ? selectedKey.key_origin === "RECONSTRUCTED_ASN1" || (!selectedKey.aws_master_key_arn && !selectedKey.masterkey_chipper_blob)
    : false;

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      key_id: selectedKeyId,
      customer_id: selectedCustomerId,
    };

    try {
      const res = await fetch("http://localhost:3010/mailforwardcust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error while sending e-mail to customer");
      }

      const result = await res.json();
      setMessage({
        type: "success",
        text: `E-mail for ${result.customer_name || "selected customer"} successfully generated and sent!`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Network error occurred";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-xs font-mono">Loading active Customer and Key items from KMS...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="w-full border-b border-slate-800 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Generate Customer Key E-Mail</h1>
            <p className="text-xs text-slate-400">
              Select a Public Key and target Customer to dispatch the encrypted key package
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`w-full p-4 rounded-xl border flex items-start gap-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Dropdown: AWS Public Keys */}
        <div className="space-y-2">
          <label htmlFor="publicKeySelect" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
            Select Public Key
          </label>
          
          <select
            id="publicKeySelect"
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            {publicKeys.length === 0 ? (
              <option value="" disabled className="bg-slate-900 text-slate-500">
                No Public Keys found
              </option>
            ) : (
              publicKeys.map((key) => {
                const keyIsReconstructed =
                  key.key_origin === "RECONSTRUCTED_ASN1" || (!key.aws_master_key_arn && !key.masterkey_chipper_blob);

                return (
                  <option key={key.id} value={key.id} className="bg-slate-900 text-slate-200">
                    {keyIsReconstructed ? "📄 [ASN.1] " : "🛡️ [AWS KMS] "}
                    {key.derived_key_pair_name} — ID: {key.key_identifier || "N/A"} ({key.curve_type})
                  </option>
                );
              })
            )}
          </select>

          {/* KEY METRICS BOX DIRECTLY UNDER DROPDOWN */}
          {selectedKey && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 font-mono text-xs mt-2.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-[11px] text-slate-400 font-sans font-semibold">
                  Selected Key Metrics:
                </span>

                {isAsn1Reconstructed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold">
                    <FileKey className="w-3 h-3" />
                    ASN.1 Reconstructed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-semibold">
                    <Cpu className="w-3 h-3" />
                    AWS KMS Key
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">KEY IDENTIFIER:</span>
                  <span className="text-amber-400 font-bold">{selectedKey.key_identifier || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CURVE TYPE:</span>
                  <span className="text-blue-400 font-bold">{selectedKey.curve_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">AWS ALIAS / ORIGIN:</span>
                  <span className="text-slate-300 truncate block">
                    {isAsn1Reconstructed
                      ? "External Import"
                      : selectedKey.aws_alias_name
                      ? `alias/${selectedKey.aws_alias_name}`
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            The public key and the customer together form the payload for sending the key package.
          </p>
        </div>

        {/* Dropdown: Customers */}
        <div className="space-y-2">
          <label htmlFor="customerSelect" className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            Select Target Customer
          </label>
          
          <select
            id="customerSelect"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
          >
            {customers.length === 0 ? (
              <option value="" disabled className="bg-slate-900 text-slate-500">
                No Customers found
              </option>
            ) : (
              customers.map((cust) => (
                <option key={cust.id} value={cust.id} className="bg-slate-900 text-slate-200">
                  {cust.customer_name} ({cust.customer_email})
                </option>
              ))
            )}
          </select>
          <p className="text-[11px] text-slate-500">
            The destination customer receiving the generated key package via email.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting || publicKeys.length === 0 || customers.length === 0}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sending E-Mail...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send E-Mail</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}