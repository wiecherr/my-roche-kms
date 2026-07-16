// src/app/rfid/TagForm.tsx
'use client' // Da wir interaktive Hooks (Zustände) nutzen

import { useActionState } from 'react';
import { registerRfidTag } from './rfidactions';
import { Cpu, Layers, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function TagForm() {
  // state enthält den Rückgabewert der Server Action, formAction wird an das Formular übergeben
  const [state, formAction, isPending] = useActionState(registerRfidTag, {
    success: false,
    error: null,
  });

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-100 border border-slate-200/80 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">
      
      
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white">
        <h2 className="text-xl font-semibold tracking-tight">RFID Tag Registrierung</h2>
        <p className="text-sm text-slate-400 mt-1">Geben Sie die Hardware-Spezifikationen ein, um den Diversifizierungsprozess im KMS zu starten.</p>
      </div>
      
      <form action={formAction} className="space-y-6">
        {/* UID Feld */}
        <div>
          <label htmlFor="uid" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            NXP Chip UID (14-stellige Hex-Zahl)
          </label>
          <input
            type="text"
            id="uid"
            name="uid"
            required
            maxLength={16}
            placeholder="04A2B3C4D5E6F7FF"
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-base uppercase tracking-wider text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          />
        </div>

        {/* Batch / Chargen Auswahl */}
        <div>
          <label htmlFor="batchId" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            Zugehörige Charge (Batch)
          </label>
          <select
            id="batchId"
            name="batchId"
            required
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-base uppercase tracking-wider text-slate-800 placeholder-slate-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          >
            <option value="batch-2026-001">NXP IC3 - Charge 001</option>
            <option value="batch-2026-002">NXP IC3 - Charge 002</option>
            <option value="batch-2026-003">NXP IC3 - Charge 003</option>
          </select>
        </div>
        <div className="border-t border-slate-100 my-2" />

        {/* Status- & Fehlermeldungen */}
        {state.error && (
          <div className="p-3 text-sm bg-red-50 text-red-600 rounded-md">
            ⚠️ {state.error}
          </div>
        )}
        
        {state.success && (
          <div className="p-3 text-sm bg-green-50 text-green-600 rounded-md">
            ✅ RFID Tag erfolgreich im KMS registriert!
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400"
        >
          {isPending ? 'Verarbeite im KMS...' : 'Tag im System anlegen'}
        </button>
      </form>
    </div>
  );
}