"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Settings, 
  KeyRound, 
  Cloud, 
  ShieldAlert, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft,
  Lock,
  Globe,
  ServerOff,
  Database,
  User,
  HardDrive,
  Copy,
  Check,
  Mail,
  Server,
  Key,
  ShieldCheck,
  Fingerprint,
  ChevronDown,
  ChevronUp,
  LayoutDashboard
} from "lucide-react";

// Interaktive Komponente für die komprimierte PEM-Schlüssel-Anzeige
function PemKeyViewer({ label, pemKey, isPrivate }: { label: string; pemKey: string; isPrivate?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pemKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPreviewText = (rawKey: string) => {
    if (!rawKey) return "";
    const lines = rawKey.trim().split("\n");
    if (lines.length <= 2) return rawKey;
    return `${lines[0]}\n... [${lines.length - 2} lines hidden] ...\n${lines[lines.length - 1]}`;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1 font-mono">
          <Key className={`w-3 h-3 ${isPrivate ? "text-rose-400" : "text-emerald-400"}`} />
          {label}
        </span>
        
        <div className="flex items-center gap-2">
          {pemKey && (
            <button
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-white transition-colors bg-slate-900 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}

          {pemKey && (
            <button
              onClick={() => setExpanded(!expanded)}
              type="button"
              className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 cursor-pointer"
            >
              <span>{expanded ? "Collapse" : "Expand"}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      <div 
        onClick={() => pemKey && setExpanded(!expanded)}
        className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-[10px] cursor-pointer hover:border-slate-700 transition-all group min-h-[42px]"
      >
        {!pemKey ? (
          <p className="text-slate-600 italic">No key set. Click ´Generate New RSA Key Pair above.</p>
        ) : (
          <p className={`break-all leading-relaxed ${isPrivate ? "text-rose-400/90" : "text-emerald-400/90"} ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
            {expanded ? pemKey : getPreviewText(pemKey)}
          </p>
        )}
      </div>
    </div>
  );
}

export default function KMSSettingsPage() {
  const router = useRouter();

  // Zustände
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // States für Copy-Feedback (DSN)
  const [copiedDsn, setCopiedDsn] = useState<boolean>(false);

  // States für RSA Schlüssel
  const [privateKey, setPrivateKey] = useState<string>("");
  const [publicKey, setPublicKey] = useState<string>("");

  // States für AWS Cloud Konfiguration (ENV Data)
  const [awsRegion, setAwsRegion] = useState<string>("eu-central-1");
  const [awsAccessKeyId, setAwsAccessKeyId] = useState<string>("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState<string>("");
  const [awsEc2MetadataDisabled, setAwsEc2MetadataDisabled] = useState<boolean>(true);

  // States für PostgreSQL DB Konfiguration
  const [dbHost, setDbHost] = useState<string>("localhost:5432");
  const [dbUser, setDbUser] = useState<string>("postgres");
  const [dbPassword, setDbPassword] = useState<string>("");
  const [dbName, setDbName] = useState<string>("RFID_KMS");
  const [dbSslMode, setDbSslMode] = useState<string>("disable");

  // States für SMTP E-Mail Server & Web-UI Konfiguration (z. B. Mailpit)
  const [smtpHost, setSmtpHost] = useState<string>("127.0.0.1");
  const [smtpPort, setSmtpPort] = useState<string>("1025");
  const [smtpFromEmail, setSmtpFromEmail] = useState<string>("kms-notifications@company.com");
  const [smtpUsername, setSmtpUsername] = useState<string>("");
  const [smtpPassword, setSmtpPassword] = useState<string>("");
  // NEU: Web UI URL für Mailpit Dashboard
  const [mailpitWebUi, setMailpitWebUi] = useState<string>("http://localhost:8025");

  // States für SSO (Single Sign-On / OIDC) Konfiguration
  const [ssoClientId, setSsoClientId] = useState<string>("");
  const [ssoClientSecret, setSsoClientSecret] = useState<string>("");
  const [ssoIssuerUrl, setSsoIssuerUrl] = useState<string>("https://auth.company.com/realms/kms");
  const [SSORedirectURL, setSSORedirectURL] = useState<string>("http://localhost:3000/api/auth/callback");

  // Loading-States
  const [loadingSettings, setLoadingSettings] = useState<boolean>(true);
  const [generatingKeyPair, setGeneratingKeyPair] = useState<boolean>(false);

  // 1. Initiales Laden der bestehenden Einstellungen
  useEffect(() => {
    async function fetchSettings() {
      setLoadingSettings(true);
      try {
        const res = await fetch("http://localhost:3010/kms-settings-hq", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Fehler beim Laden der aktuellen Einstellungen");
        }

        const data = await res.json();

        if (data) {
          // RSA Keys
          setPrivateKey(data.private_key_pem || data.private_key || data.privateKey || "");
          setPublicKey(data.public_key_pem || data.public_key || data.publicKey || "");
          
          // AWS Cloud Config
          setAwsRegion(data.aws_region || data.awsRegion || "eu-central-1");
          setAwsAccessKeyId(data.aws_access_key_id || data.awsAccessKeyId || "");
          setAwsSecretAccessKey(data.aws_secret_access_key || data.awsSecretAccessKey || "");
          
          // AWS EC2 Metadata Check
          const metadataDisabledVal = data.aws_ec2_metadata_disabled ?? data.awsEc2MetadataDisabled;
          if (typeof metadataDisabledVal === "boolean") {
            setAwsEc2MetadataDisabled(metadataDisabledVal);
          } else if (typeof metadataDisabledVal === "string") {
            setAwsEc2MetadataDisabled(metadataDisabledVal.toLowerCase() === "true");
          } else {
            setAwsEc2MetadataDisabled(true);
          }

          // PostgreSQL Config
          if (data.db_host || data.dbHost) setDbHost(data.db_host || data.dbHost);
          if (data.db_user || data.dbUser) setDbUser(data.db_user || data.dbUser);
          if (data.db_password || data.dbPassword) setDbPassword(data.db_password || data.dbPassword);
          if (data.db_name || data.dbName) setDbName(data.db_name || data.dbName);
          if (data.db_sslmode || data.dbSslMode) setDbSslMode(data.db_sslmode || data.dbSslMode);

          // Connection String Parser
          const connectionString = data.db_connection_string || data.dbConnectionString;
          if (connectionString) {
            try {
              const url = new URL(connectionString);
              setDbUser(url.username);
              setDbPassword(url.password);
              setDbHost(`${url.hostname}${url.port ? `:${url.port}` : ""}`);
              setDbName(url.pathname.replace("/", ""));
              setDbSslMode(url.searchParams.get("sslmode") || "disable");
            } catch (e) {
              console.warn("Could not parse db connection string:", e);
            }
          }

          // SMTP & Mail UI Settings setzen
          if (data.smtp_host || data.smtpHost) setSmtpHost(data.smtp_host || data.smtpHost);
          if (data.smtp_port || data.smtpPort) setSmtpPort(String(data.smtp_port || data.smtpPort));
          if (data.smtp_from_email || data.smtpFromEmail) setSmtpFromEmail(data.smtp_from_email || data.smtpFromEmail);
          if (data.smtp_username || data.smtpUsername) setSmtpUsername(data.smtp_username || data.smtpUsername);
          if (data.smtp_password || data.smtpPassword) setSmtpPassword(data.smtp_password || data.smtpPassword);
          if (data.mailpit_web_ui || data.mailpitWebUi) setMailpitWebUi(data.mailpit_web_ui || data.mailpitWebUi);

          // SSO Settings setzen
          if (data.sso_client_id || data.ssoClientId) setSsoClientId(data.sso_client_id || data.ssoClientId);
          if (data.sso_client_secret || data.ssoClientSecret) setSsoClientSecret(data.sso_client_secret || data.ssoClientSecret);
          if (data.sso_issuer_url || data.ssoIssuerUrl) setSsoIssuerUrl(data.sso_issuer_url || data.ssoIssuerUrl);
          if (data.sso_redirect_url || data.SSORedirectURL) setSSORedirectURL(data.sso_redirect_url || data.SSORedirectURL);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Fehler beim Laden der Einstellungen";
        setMessage({ type: "error", text: errorMessage });
      } finally {
        setLoadingSettings(false);
      }
    }

    fetchSettings();
  }, []);

  // Helper zum Kopieren des DSN
  const handleCopyDsn = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedDsn(true);
    setTimeout(() => setCopiedDsn(false), 2000);
  };

  // Dynamischen Connection-String berechnen
  const generatedDsn = `postgres://${dbUser || "user"}:${dbPassword || "password"}@${dbHost || "localhost:5432"}/${dbName || "dbname"}?sslmode=${dbSslMode}`;

  // RSA Schlüsselpaar generieren
  const handleGenerateKeyPair = async () => {
    setGeneratingKeyPair(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:3010/generate-rsakey-hq", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Fehler beim Generieren des RSA-Schlüsselpaars");

      const data = await res.json();
      setPrivateKey(data.private_key || data.privateKey || data.private_key_pem || "");
      setPublicKey(data.public_key || data.publicKey || data.public_key_pem || "");

      setMessage({ type: "success", text: "Neues RSA Schlüsselpaar erfolgreich erzeugt!" });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Fehler beim Abrufen des Schlüsselpaars";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setGeneratingKeyPair(false);
    }
  };

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      private_key_pem: privateKey.trim(),
      public_key_pem: publicKey.trim(),
      aws_region: awsRegion.trim(),
      aws_access_key_id: awsAccessKeyId.trim(),
      aws_secret_access_key: awsSecretAccessKey.trim(),
      aws_ec2_metadata_disabled: awsEc2MetadataDisabled,
      db_host: dbHost.trim(),
      db_user: dbUser.trim(),
      db_password: dbPassword,
      db_name: dbName.trim(),
      db_sslmode: dbSslMode.trim(),
      db_connection_string: generatedDsn,
      // Mail Server & Mailpit UI Daten
      smtp_host: smtpHost.trim(),
      smtp_port: parseInt(smtpPort.trim(), 10) || 1025,
      smtp_from_email: smtpFromEmail.trim(),
      smtp_username: smtpUsername.trim(),
      smtp_password: smtpPassword,
      mailpit_web_ui: mailpitWebUi.trim(),
      // SSO Daten
      sso_client_id: ssoClientId.trim(),
      sso_client_secret: ssoClientSecret.trim(),
      sso_issuer_url: ssoIssuerUrl.trim(),
      sso_redirect_url: SSORedirectURL.trim(),
    };

    try {
      const res = await fetch("http://localhost:3010/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Fehler beim Speichern der Einstellungen");
      }

      setMessage({
        type: "success",
        text: "KMS, Mail-Server, SSO & Datenbank-Einstellungen erfolgreich gespeichert!",
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Netzwerkfehler beim Speichern der Einstellungen.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 py-2 pb-24">
      {/* Header */}
      <div className="w-full border-b border-slate-800 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">System & KMS Settings</h1>
            <p className="text-xs text-slate-400">
              Manage local RSA encryption keys, PostgreSQL database, Mail Server, SSO, and AWS Cloud HSM connection parameters
            </p>
          </div>
        </div>
      </div>

      {/* Benachrichtigungen */}
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

      {/* Formular-Container */}
      <form onSubmit={handleSubmit} className="space-y-8 relative">
        
        {/* SEKTION 1: AWS Cloud Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <Cloud className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">AWS Cloud KMS Environment Configuration</h2>
              <p className="text-xs text-slate-400">Credentials and connection parameters for cloud-based Key Encryption Key (KEK) operations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* AWS Region */}
            <div>
              <label htmlFor="awsRegion" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                AWS Region
              </label>
              <input
                id="awsRegion"
                type="text"
                value={awsRegion}
                onChange={(e) => setAwsRegion(e.target.value)}
                placeholder="e.g. eu-central-1"
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* AWS Access Key ID */}
            <div>
              <label htmlFor="awsAccessKeyId" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                AWS Access Key ID
              </label>
              <input
                id="awsAccessKeyId"
                type="text"
                value={awsAccessKeyId}
                onChange={(e) => setAwsAccessKeyId(e.target.value)}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* AWS Secret Access Key */}
            <div>
              <label htmlFor="awsSecretAccessKey" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                AWS Secret Access Key
              </label>
              <input
                id="awsSecretAccessKey"
                type="password"
                value={awsSecretAccessKey}
                onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* AWS EC2 Metadata Disabled */}
            <div className="flex flex-col justify-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ServerOff className="w-3.5 h-3.5 text-indigo-400" />
                Disable EC2 Metadata Service (`AWS_EC2_METADATA_DISABLED`)
              </label>
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-2.5 h-10.5">
                <button
                  type="button"
                  disabled={loadingSettings}
                  onClick={() => setAwsEc2MetadataDisabled(!awsEc2MetadataDisabled)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                    awsEc2MetadataDisabled ? "bg-indigo-600" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      awsEc2MetadataDisabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs font-mono text-slate-300">
                  {awsEc2MetadataDisabled ? (
                    <span className="text-emerald-400 font-semibold">true (Recommended for non-EC2/Local)</span>
                  ) : (
                    <span className="text-slate-400">false (Use IMDS)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SEKTION 2: PostgreSQL Database Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">PostgreSQL Database Connection</h2>
              <p className="text-xs text-slate-400">Database server credentials and target instance configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. DB User & Password */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                1. User & Password
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="Username (e.g. postgres)"
                  disabled={loadingSettings}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
                <input
                  type="password"
                  value={dbPassword}
                  onChange={(e) => setDbPassword(e.target.value)}
                  placeholder="Password"
                  disabled={loadingSettings}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* 2. Host & Port */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                2. Host & Port
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={dbHost}
                  onChange={(e) => setDbHost(e.target.value)}
                  placeholder="Host:Port (e.g. localhost:5432)"
                  disabled={loadingSettings}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
                />
                <p className="text-[10px] text-slate-500">Includes server hostname and PostgreSQL port.</p>
              </div>
            </div>

            {/* 3. Database Name & SSL Mode */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                3. Database & SSL Mode
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="Database Name (e.g. RFID_KMS)"
                  disabled={loadingSettings}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
                <select
                  value={dbSslMode}
                  onChange={(e) => setDbSslMode(e.target.value)}
                  disabled={loadingSettings}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="disable">sslmode=disable</option>
                  <option value="require">sslmode=require</option>
                  <option value="verify-ca">sslmode=verify-ca</option>
                  <option value="verify-full">sslmode=verify-full</option>
                </select>
              </div>
            </div>
          </div>

          {/* Connection String Preview mit COPY-BUTTON */}
          <div className="mt-2 p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="overflow-hidden">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block mb-1">
                Generated DSN Connection String:
              </span>
              <p className="font-mono text-[11px] text-emerald-400/90 break-all select-all">
                {generatedDsn}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => handleCopyDsn(generatedDsn)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-xs font-semibold text-slate-300 transition-all shrink-0 cursor-pointer"
            >
              {copiedDsn ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SEKTION 3: E-Mail Server & Web-UI Konfiguration (SMTP & Mailpit) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <Mail className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">SMTP Mail Server & Web UI (Mailpit)</h2>
              <p className="text-xs text-slate-400">Outbound mail server parameters (SMTP) and optional web interface endpoint</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* SMTP Host & Port */}
            <div>
              <label htmlFor="smtpHost" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                SMTP Host & Port
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  id="smtpHost"
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="127.0.0.1"
                  disabled={loadingSettings}
                  className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
                <input
                  id="smtpPort"
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="1025"
                  disabled={loadingSettings}
                  className="col-span-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Mailpit / Mail Web-UI Endpoint */}
            <div>
              <label htmlFor="mailpitWebUi" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                Mailpit Web UI Endpoint
              </label>
              <input
                id="mailpitWebUi"
                type="text"
                value={mailpitWebUi}
                onChange={(e) => setMailpitWebUi(e.target.value)}
                placeholder="http://localhost:8025"
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* SMTP From Email */}
            <div>
              <label htmlFor="smtpFromEmail" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                Sender (`From:`)
              </label>
              <input
                id="smtpFromEmail"
                type="email"
                value={smtpFromEmail}
                onChange={(e) => setSmtpFromEmail(e.target.value)}
                placeholder="kms-system@company.com"
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* SMTP Credentials */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                SMTP Auth (Optional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="User"
                  disabled={loadingSettings}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all disabled:opacity-50"
                />
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="Pass"
                  disabled={loadingSettings}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SEKTION 4: Single Sign-On (SSO / OIDC) Handler */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
            <Fingerprint className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">Single Sign-On (SSO / OIDC) Authentication</h2>
              <p className="text-xs text-slate-400">Identity Provider (Keycloak / Okta / Azure AD) credentials for OAuth2/OIDC user login</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SSO Client ID */}
            <div>
              <label htmlFor="ssoClientId" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                SSO Client ID
              </label>
              <input
                id="ssoClientId"
                type="text"
                value={ssoClientId}
                onChange={(e) => setSsoClientId(e.target.value)}
                placeholder="e.g. rfid-kms-backend-client"
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* SSO Client Secret */}
            <div>
              <label htmlFor="ssoClientSecret" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                SSO Client Secret
              </label>
              <input
                id="ssoClientSecret"
                type="password"
                value={ssoClientSecret}
                onChange={(e) => setSsoClientSecret(e.target.value)}
                placeholder="OAuth2 Client Secret Key..."
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* SSO Issuer / OpenID Discovery URL */}
            <div>
              <label htmlFor="ssoIssuerUrl" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                SSO Issuer / Identity Provider URL
              </label>
              <input
                id="ssoIssuerUrl"
                type="text"
                value={ssoIssuerUrl}
                onChange={(e) => setSsoIssuerUrl(e.target.value)}
                placeholder="https://auth.company.com/realms/kms"
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* SSO Redirect URI */}
            <div>
              <label htmlFor="SSORedirectURL" className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                Authorized Redirect Callback URI
              </label>
              <input
                id="SSORedirectURL"
                type="text"
                value={SSORedirectURL}
                onChange={(e) => setSSORedirectURL(e.target.value)}
                placeholder="http://localhost:3000/api/auth/callback"
                disabled={loadingSettings}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* SEKTION 5: Local RSA Key Pair */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-semibold text-slate-100">Local HQ RSA Key Pair (PEM)</h2>
                <p className="text-xs text-slate-400">Used for signing delivery packages and offline verification</p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGenerateKeyPair}
              disabled={generatingKeyPair || loadingSettings}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 px-3.5 py-2 text-xs font-medium text-indigo-300 transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {generatingKeyPair ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Generating RSA Pair...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Generate New RSA Key Pair</span>
                </>
              )}
            </button>
          </div>

          {/* Collapsible PEM Key Viewer Container */}
          {loadingSettings ? (
            <div className="h-24 w-full animate-pulse rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
              <span className="text-xs text-slate-500 font-mono">Loading RSA keys...</span>
            </div>
          ) : (
            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 space-y-3">
              <PemKeyViewer 
                label="RSA Private Key (PEM)" 
                pemKey={privateKey} 
                isPrivate={true} 
              />

              <PemKeyViewer 
                label="RSA Public Key (PEM)" 
                pemKey={publicKey} 
                isPrivate={false} 
              />
            </div>
          )}
        </div>

        {/* Standard Action Buttons ganz unten */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting || loadingSettings}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving Configuration...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>

        {/* SCHWEBENDER SAVE-BUTTON (Sticky Floating Action Bar) */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-2xl shadow-2xl shadow-black/80">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting || loadingSettings}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}