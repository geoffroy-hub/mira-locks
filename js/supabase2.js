/* ============================================================
   Miralocks — supabase2.js  Version: 2.1 — SPÉCIAL VIDÉOS
   ⚠️  SECONDE instance Supabase — VIDÉOS UNIQUEMENT
   ─────────────────────────────────────────────────────────────
   Cette instance est distincte de supabase.js (sb).
   Elle gère UNIQUEMENT le bucket vidéo : Miralocks-videos.

   Utilisation :
     - Upload vidéo  → sb2.upload('videos', file)
     - Suppression   → sb2.deleteFile(url)

   ⛔ Ne pas fusionner avec supabase.js
   ⛔ Ne pas déplacer les appels sb2 dans d'autres modules
   ─────────────────────────────────────────────────────────────
   Instance 1 (sb)  → mqityrifhiaarwdcacxo.supabase.co (tout)
   Instance 2 (sb2) → jihpbaeozvksgsipljsb.supabase.co (vidéos)
   ============================================================ */

// REMPLACER PAR VOS VRAIES INFOS DE LA 2ÈME INSTANCE
const SUPABASE2_URL = 'https://jihpbaeozvksgsipljsb.supabase.co';
const SUPABASE2_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppaHBiYWVvenZrc2dzaXBsanNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyOTQ3NzIsImV4cCI6MjA5MDg3MDc3Mn0.UR8k6zRoC3s2FSDvo0wplzXKbmKdV4zMmQHjg6HSS6o';
const SUPABASE2_BUCKET = 'Miralocks-videos'; // Nom du bucket sur la 2ème instance

const sb2 = {
  /* headers communs */
  _h(token = null) {
    return {
      'Content-Type': 'application/json',
      'apikey': SUPABASE2_ANON,
      'Authorization': `Bearer ${token || SUPABASE2_ANON}`,
    };
  },

  /* ── STORAGE — upload fichier (Public pour simplicité si pas d'auth sur la 2ème) ── */
  async upload(folder, file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const ct = file.type || 'application/octet-stream';
    
    const r = await fetch(
      `${SUPABASE2_URL}/storage/v1/object/${SUPABASE2_BUCKET}/${name}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE2_ANON,
          'Authorization': `Bearer ${SUPABASE2_ANON}`,
          'Content-Type': ct,
        },
        body: file,
      }
    );
    
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new Error(e.message || e.error || `Upload vidéo échoué (${r.status})`);
    }
    
    return `${SUPABASE2_URL}/storage/v1/object/public/${SUPABASE2_BUCKET}/${name}`;
  },

  /* ── STORAGE — suppression ── */
  async deleteFile(url) {
    if (!url || !url.includes(SUPABASE2_URL)) return;
    const path = url.split(`/${SUPABASE2_BUCKET}/`)[1];
    if (!path) return;
    
    await fetch(`${SUPABASE2_URL}/storage/v1/object/${SUPABASE2_BUCKET}/${path}`, {
      method: 'DELETE',
      headers: { 
        'apikey': SUPABASE2_ANON, 
        'Authorization': `Bearer ${SUPABASE2_ANON}` 
      },
    }).catch(() => { });
  }
};

/* Exposer globalement */
window.sb2 = sb2;
window.SUPABASE2_URL = SUPABASE2_URL;
window.SUPABASE2_ANON = SUPABASE2_ANON;
