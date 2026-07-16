// src/app/rfid/actions.ts
'use server' // Garantiert, dass dieser Code NUR auf dem Server läuft

import { revalidatePath } from 'next/cache';

export async function registerRfidTag(prevState: any, formData: FormData) {
  const uid = formData.get('uid') as string;
  const batchId = formData.get('batchId') as string;

  // Einfache Validierung im Next.js-Server vorab
  if (!uid || uid.length !== 16) {
    return { success: false, error: 'Die NXP UID muss genau 14 Hex-Zeichen lang sein.' };
  }

  try {
    // REST-API-Aufruf an das Go-Backend
    const response = await fetch('http://localhost:3010/tagitems', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: "4",
        uid: uid,
        batchid: batchId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.message || `Go-Backend Fehler: Status ${response.status}` 
      };
    }

    // Wenn erfolgreich, weisen wir Next.js an, die Cache-Daten für die Liste zu erneuern
    revalidatePath('/rfid');
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'Verbindung zum Krypto-Backend fehlgeschlagen.' };
  }
}