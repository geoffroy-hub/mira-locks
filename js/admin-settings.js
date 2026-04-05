/* ============================================================
   Miralocks Admin — admin-settings.js
   Module : Upload, Drag & Drop, Iframe Maps, Licence,
            Paiements (CinetPay, FedaPay, KKiaPay, Paygate),
            Planning / Calendrier
   ============================================================ */

    /* ── UPLOAD PROGRESS HELPERS ─────────────────────────────── */
    function showProgress(name, pct) {
      const prog = $(`${name}-progress`);
      const bar = $(`${name}-progress-bar`);
      if (prog) prog.style.display = 'block';
      if (bar) bar.style.width = pct + '%';
    }
    function hideProgress(name) {
      const prog = $(`${name}-progress`);
      const bar = $(`${name}-progress-bar`);
      setTimeout(() => {
        if (prog) prog.style.display = 'none';
        if (bar) bar.style.width = '0%';
      }, 600);
    }

    /* ── DRAG & DROP ─────────────────────────────────────────── */
    document.querySelectorAll('.upload-zone').forEach(zone => {
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
      zone.addEventListener('drop', e => {
        e.preventDefault(); zone.classList.remove('drag');
        const input = zone.querySelector('input[type=file]');
        if (input) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change')); }
      });
    });

    /* Préview blog */
    $('blog-photo-file').addEventListener('change', function () {
      if (this.files[0]) {
        const url = URL.createObjectURL(this.files[0]);
        $('blog-preview').innerHTML = `<div class="upload-preview-item"><img src="${url}"><div class="remove-file" onclick="this.parentNode.parentNode.innerHTML='';$('blog-photo-file').value=''">×</div></div>`;
      }
    });

    /* ══════════════════════════════════════════════════════════
       PARAMÈTRES — Configuration des cartes
    ══════════════════════════════════════════════════════════ */

    const MAP_LAT = 6.224345, MAP_LNG = 1.193420;

    async function loadParametres() {
      // Charger les configs en parallèle
      await Promise.all([
        loadCinetPayStatus(),
        loadFedaPayStatus(),
        loadKKiaPayStatus(),
        loadPaygateStatus(),
        loadLicenseStatus()
      ]);
      loadSimPreview('google');
    }

    /* ── IFRAME GOOGLE PERSONNALISÉ ─────────────────────────── */

    async function loadCustomIframeStatus() {
      const badge = $('custom-iframe-badge');
      const removeZone = $('custom-iframe-remove-zone');
      const preview = $('custom-iframe-preview');
      const iframeEl = $('custom-iframe-el');
      const input = $('custom-iframe-url');
      try {
        const url = await sb.settings.get('custom_google_iframe_url');
        if (url) {
          badge.textContent = 'Configuré';
          badge.className = 'badge badge-success';
          removeZone.style.display = 'block';
          input.value = url;
          iframeEl.src = url;
          preview.style.display = 'block';
        } else {
          badge.textContent = 'Non configuré';
          badge.className = 'badge badge-warning';
          removeZone.style.display = 'none';
          preview.style.display = 'none';
        }
      } catch (e) {
        badge.textContent = 'Non configuré';
        badge.className = 'badge badge-warning';
      }
    }

    async function saveCustomIframe() {
      const input = $('custom-iframe-url');
      const url = input.value.trim();
      if (!url) { toast("Veuillez coller une URL d'embed Google Maps", 'error'); return; }
      if (!url.startsWith('https://www.google.com/maps/embed')) {
        toast("L'URL doit commencer par https://www.google.com/maps/embed", 'error'); return;
      }
      const btn = $('custom-iframe-save-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement…';
      try {
        await sb.settings.set('custom_google_iframe_url', url);
        toast('Iframe personnalisé enregistré !', 'success');
        await loadCustomIframeStatus();
      } catch (e) {
        toast("Erreur lors de l'enregistrement", 'error');
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    }

    async function removeCustomIframe() {
      if (!confirm('Supprimer l\'iframe personnalisé ?')) return;
      try {
        await sb.settings.delete('custom_google_iframe_url');
        $('custom-iframe-url').value = '';
        toast('Iframe personnalisé supprimé', 'success');
        await loadCustomIframeStatus();
      } catch (e) {
        toast("Erreur lors de la suppression", 'error');
      }
    }
 
    /* ── GESTION LICENCE (TOGO) ─────────────────────────── */
 
    async function loadLicenseStatus() {
      const badge = $('license-badge');
      const textInp = $('license-text');
      const removeBtn = $('license-remove-btn');
 
      const pdfZone = $('license-pdf-zone');
      const pdfPreview = $('license-pdf-preview');
      const pdfName = $('license-pdf-name');
 
      try {
        const [text, pdfUrl] = await Promise.all([
          sb.settings.get('site_license_togolese'),
          sb.settings.get('site_license_pdf_url')
        ]);
 
        if (text) {
          badge.textContent = 'Configuré';
          badge.className = 'badge badge-success';
          textInp.value = text;
          removeBtn.style.display = 'inline-block';
        } else {
          badge.textContent = 'Non défini';
          badge.className = 'badge badge-warning';
          removeBtn.style.display = 'none';
        }
 
        if (pdfUrl) {
          pdfZone.style.display = 'none';
          pdfPreview.style.display = 'flex';
          pdfName.textContent = 'Document PDF enregistré';
          pdfName.title = pdfUrl;
        } else {
          pdfZone.style.display = 'flex';
          pdfPreview.style.display = 'none';
        }
 
      } catch (e) { console.error('License load error:', e); }
    }
 
    async function uploadLicensePDF(input) {
      if (!input.files || !input.files[0]) return;
      const file = input.files[0];
      if (file.type !== 'application/pdf') { toast('Format PDF requis', 'error'); return; }
 
      const status = $('license-pdf-status');
      status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Upload en cours…';
 
      try {
        const path = `docs/licence_${Date.now()}.pdf`;
        const url = await sb.storage.upload(file, path);
        await sb.settings.set('site_license_pdf_url', url);
        toast('PDF enregistré avec succès !', 'success');
        await loadLicenseStatus();
      } catch (e) {
        toast(`Erreur d'upload : ${e.message || "Accès refusé"}`, 'error');
        console.error(e);
        status.innerHTML = 'Cliquez pour uploader le PDF original<br><small>Format PDF uniquement</small>';
      }
    }
 
    async function removeLicensePDF() {
      if (!confirm('Supprimer le fichier PDF ?')) return;
      try {
        await sb.settings.delete('site_license_pdf_url');
        toast('Fichier PDF supprimé', 'warning');
        await loadLicenseStatus();
      } catch (e) { toast("Erreur lors de la suppression", 'error'); }
    }
 
    async function saveLicenseSettings() {
      const text = $('license-text').value.trim();
      if (!text) { toast('Veuillez entrer le texte de la licence', 'error'); return; }
 
      const btn = $('license-save-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement…';
 
      try {
        await sb.settings.set('site_license_togolese', text);
        toast('Licence enregistrée !', 'success');
        await loadLicenseStatus();
      } catch (e) { toast('Erreur lors de l\'enregistrement', 'error'); }
      
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer la licence';
    }
 
    async function removeLicenseSettings() {
      if (!confirm('Supprimer tout le contenu de la licence (texte + PDF) ?')) return;
      try {
        await Promise.all([
          sb.settings.delete('site_license_togolese'),
          sb.settings.delete('site_license_pdf_url')
        ]);
        $('license-text').value = '';
        toast('Licence réinitialisée', 'warning');
        await loadLicenseStatus();
      } catch (e) { toast('Erreur lors de la suppression', 'error'); }
    }

    /* ── CONFIGURATION CINETPAY ─────────────────────────── */

    /* ── CONFIGURATION CINETPAY ─────────────────────────── */

    async function loadCinetPayStatus() {
      const badge = $('cinetpay-badge');
      const apiKeyInp = $('cinetpay-apikey');
      const siteIdInp = $('cinetpay-siteid');
      const modeInp = $('cinetpay-mode');
      const removeBtn = $('cinetpay-remove-btn');

      try {
        const apiKey = await sb.settings.get('cinetpay_apikey');
        const siteId = await sb.settings.get('cinetpay_siteid');
        const mode = await sb.settings.get('cinetpay_mode') || 'TEST';

        if (apiKey && siteId) {
          badge.textContent = mode === 'PRODUCTION' ? 'PRODUCTION' : 'TEST ACTIF';
          badge.className = mode === 'PRODUCTION' ? 'badge badge-success' : 'badge badge-warning';
          apiKeyInp.value = apiKey;
          siteIdInp.value = siteId;
          modeInp.value = mode;
          removeBtn.style.display = 'inline-block';
        } else {
          badge.textContent = 'Non configuré';
          badge.className = 'badge badge-warning';
          removeBtn.style.display = 'none';
        }
      } catch (e) {
        console.error('CinetPay load error:', e);
      }
    }
    window.loadCinetPayStatus = loadCinetPayStatus;

    async function saveCinetPaySettings() {
      const apiKey = $('cinetpay-apikey').value.trim();
      const siteId = $('cinetpay-siteid').value.trim();
      const mode = $('cinetpay-mode').value;

      if (!apiKey || !siteId) {
        toast('Veuillez remplir l\'API Key et le Site ID', 'error');
        return;
      }

      const btn = $('cinetpay-save-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement…';

      try {
        await Promise.all([
          sb.settings.set('cinetpay_apikey', apiKey),
          sb.settings.set('cinetpay_siteid', siteId),
          sb.settings.set('cinetpay_mode', mode)
        ]);
        showToast('Configuration CinetPay enregistrée !', 'success');
        await loadCinetPayStatus();
      } catch (e) {
        showToast('Erreur lors de l\'enregistrement', 'error');
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer la configuration';
    }
    window.saveCinetPaySettings = saveCinetPaySettings;

    async function removeCinetPaySettings() {
      if (!confirm('Réinitialiser la configuration CinetPay ?')) return;
      try {
        await Promise.all([
          sb.settings.delete('cinetpay_apikey'),
          sb.settings.delete('cinetpay_siteid'),
          sb.settings.delete('cinetpay_mode')
        ]);
        $('cinetpay-apikey').value = '';
        $('cinetpay-siteid').value = '';
        showToast('Configuration CinetPay supprimée', 'success');
        await loadCinetPayStatus();
      } catch (e) {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
    window.removeCinetPaySettings = removeCinetPaySettings;

    /* ── CONFIGURATION FEDAPAY ─────────────────────────── */

    async function loadFedaPayStatus() {
      const badge = $('fedapay-badge');
      const apiKeyInp = $('fedapay-apikey');
      const modeInp = $('fedapay-mode');
      const removeBtn = $('fedapay-remove-btn');

      try {
        const apiKey = await sb.settings.get('fedapay_apikey');
        const mode = await sb.settings.get('fedapay_mode') || 'test';

        if (apiKey) {
          badge.textContent = mode === 'live' ? 'PRODUCTION' : 'TEST ACTIF';
          badge.className = mode === 'live' ? 'badge badge-success' : 'badge badge-warning';
          apiKeyInp.value = apiKey;
          modeInp.value = mode;
          removeBtn.style.display = 'inline-block';
        } else {
          badge.textContent = 'Non configuré';
          badge.className = 'badge badge-warning';
          removeBtn.style.display = 'none';
        }
      } catch (e) { console.error('FedaPay load error:', e); }
    }
    window.loadFedaPayStatus = loadFedaPayStatus;

    async function saveFedaPaySettings() {
      const apiKey = $('fedapay-apikey').value.trim();
      const mode = $('fedapay-mode').value;

      if (!apiKey) {
        toast('Veuillez entrer votre Secret Key FedaPay', 'error');
        return;
      }

      const btn = $('fedapay-save-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Activation…';

      try {
        await Promise.all([
          sb.settings.set('fedapay_apikey', apiKey),
          sb.settings.set('fedapay_mode', mode)
        ]);
        showToast('Configuration FedaPay enregistrée !', 'success');
        await loadFedaPayStatus();
      } catch (e) {
        showToast('Erreur lors de l\'enregistrement', 'error');
      }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check-circle"></i> Activer FedaPay';
    }
    window.saveFedaPaySettings = saveFedaPaySettings;

    async function removeFedaPaySettings() {
      if (!confirm('Réinitialiser la configuration FedaPay ?')) return;
      try {
        await Promise.all([
          sb.settings.delete('fedapay_apikey'),
          sb.settings.delete('fedapay_mode')
        ]);
        $('fedapay-apikey').value = '';
        showToast('Configuration FedaPay supprimée', 'success');
        await loadFedaPayStatus();
      } catch (e) {
        showToast('Erreur lors de la suppression', 'error');
      }
    }
    window.removeFedaPaySettings = removeFedaPaySettings;

    /* ── CONFIGURATION KKIAPAY ─────────────────────────── */

    async function loadKKiaPayStatus() {
      const badge = $('kkiapay-badge');
      const apiKeyInp = $('kkiapay-publickey');
      const sandboxInp = $('kkiapay-sandbox');
      const removeBtn = $('kkiapay-remove-btn');

      try {
        const apiKey = await sb.settings.get('kkiapay_publickey');
        const sandbox = await sb.settings.get('kkiapay_sandbox') !== 'false';

        if (apiKey) {
          badge.textContent = sandbox ? 'TEST ACTIF' : 'PRODUCTION';
          badge.className = sandbox ? 'badge badge-warning' : 'badge badge-success';
          apiKeyInp.value = apiKey;
          sandboxInp.checked = sandbox;
          removeBtn.style.display = 'inline-block';
        } else {
          badge.textContent = 'Non configuré';
          badge.className = 'badge badge-warning';
          removeBtn.style.display = 'none';
        }
      } catch (e) { console.error('KKiaPay load error:', e); }
    }
    window.loadKKiaPayStatus = loadKKiaPayStatus;

    async function saveKKiaPaySettings() {
      const apiKey = $('kkiapay-publickey').value.trim();
      const sandbox = $('kkiapay-sandbox').checked;
      if (!apiKey) { toast('Veuillez entrer votre Public Key KKiaPay', 'error'); return; }

      const btn = $('kkiapay-save-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement…';

      try {
        await Promise.all([
          sb.settings.set('kkiapay_publickey', apiKey),
          sb.settings.set('kkiapay_sandbox', sandbox ? 'true' : 'false')
        ]);
        showToast('Configuration KKiaPay enregistrée !', 'success');
        await loadKKiaPayStatus();
      } catch (e) { showToast('Erreur lors de l\'enregistrement', 'error'); }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer KKiaPay';
    }
    window.saveKKiaPaySettings = saveKKiaPaySettings;

    async function removeKKiaPaySettings() {
      if (!confirm('Réinitialiser la configuration KKiaPay ?')) return;
      try {
        await Promise.all([
          sb.settings.delete('kkiapay_publickey'),
          sb.settings.delete('kkiapay_sandbox')
        ]);
        $('kkiapay-publickey').value = '';
        showToast('Configuration KKiaPay supprimée', 'success');
        await loadKKiaPayStatus();
      } catch (e) { showToast('Erreur lors de la suppression', 'error'); }
    }
    window.removeKKiaPaySettings = removeKKiaPaySettings;

    /* ── CONFIGURATION PAYGATE GLOBAL ────────────────────── */

    async function loadPaygateStatus() {
      const badge = $('paygate-badge');
      const apiKeyInp = $('paygate-apikey');
      const removeBtn = $('paygate-remove-btn');

      try {
        const apiKey = await sb.settings.get('paygate_apikey');

        if (apiKey) {
          badge.textContent = 'ACTIF';
          badge.className = 'badge badge-success';
          apiKeyInp.value = apiKey;
          removeBtn.style.display = 'inline-block';
        } else {
          badge.textContent = 'Non configuré';
          badge.className = 'badge badge-warning';
          removeBtn.style.display = 'none';
        }
      } catch (e) { console.error('Paygate load error:', e); }
    }
    window.loadPaygateStatus = loadPaygateStatus;

    async function savePaygateSettings() {
      const apiKey = $('paygate-apikey').value.trim();
      if (!apiKey) { toast('Veuillez entrer votre Token API Paygate', 'error'); return; }

      const btn = $('paygate-save-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Activation…';

      try {
        await sb.settings.set('paygate_apikey', apiKey);
        showToast('Configuration Paygate enregistrée !', 'success');
        await loadPaygateStatus();
      } catch (e) { showToast('Erreur lors de l\'enregistrement', 'error'); }
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Activer Paygate';
    }
    window.savePaygateSettings = savePaygateSettings;

    async function removePaygateSettings() {
      if (!confirm('Réinitialiser la configuration Paygate ?')) return;
      try {
        await sb.settings.delete('paygate_apikey');
        $('paygate-apikey').value = '';
        showToast('Configuration Paygate supprimée', 'success');
        await loadPaygateStatus();
      } catch (e) { showToast('Erreur lors de la suppression', 'error'); }
    }
    window.removePaygateSettings = removePaygateSettings;

    /* ── Prestige : Surveillance des Rendez-vous en Temps Réel ──── */
    let _lastPendingCount = 0;
    let _rdvWatcherStarted = false;

    window.initRdvWatcher = function(initialCount) {
      if (_rdvWatcherStarted) return;
      _lastPendingCount = initialCount;
      _rdvWatcherStarted = true;

      // Vérifier toutes les 60 secondes
      setInterval(async () => {
        try {
          const counts = await sb.rdv.counts();
          if (counts.en_attente > _lastPendingCount) {
            playNotificationChime();
            pulseRdvBadge();
            _lastPendingCount = counts.en_attente;
            // Optionnel : recharger le dashboard si on est dessus
            if ($('panel-dashboard').classList.contains('active')) loadDashboard();
          } else if (counts.en_attente < _lastPendingCount) {
             _lastPendingCount = counts.en_attente; // Mise à jour si traité
          }
        } catch (e) { console.warn('[Watcher] Erreur silentieuse:', e); }
      }, 60000);
    };

    function playNotificationChime() {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch (e) { console.warn('Audio check blocked by browser policy'); }
    }

    function pulseRdvBadge() {
       const badge = $('rdv-badge');
       if (badge) {
         badge.style.animation = 'none';
         badge.offsetHeight; // trigger reflow
         badge.style.animation = 'pulse-prestige 2s infinite';
       }
    }
    /* ── Prestige : Export Agenda du Jour ───────────────────────── */
    window.printDailyAgenda = async function() {
      try {
        const all = await sb.rdv.list(null);
        const today = new Date().toISOString().split('T')[0];
        const rdvs = all.filter(r => r.date_rdv === today && (r.statut === 'confirme' || r.statut === 'en_attente'))
                        .sort((a,b) => (a.heure||'').localeCompare(b.heure||''));

        if (!rdvs.length) {
          showToast("Aucun rendez-vous prévu pour aujourd'hui.", "info");
          return;
        }

        const win = window.open('', '_blank');
        const rows = rdvs.map(r => `
          <tr>
            <td style="padding:12px; border-bottom:1px solid #eee"><strong>${r.heure || '--:--'}</strong></td>
            <td style="padding:12px; border-bottom:1px solid #eee">${escHtml(r.nom)}<br><small style="color:#666">${r.tel}</small></td>
            <td style="padding:12px; border-bottom:1px solid #eee">${escHtml(r.service)}</td>
            <td style="padding:12px; border-bottom:1px solid #eee; font-style:italic; color:#777">${escHtml(r.note_admin || '')}</td>
          </tr>
        `).join('');

        win.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Agenda Miralocks - ${new Date().toLocaleDateString('fr-FR')}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
              header { text-align: center; border-bottom: 2px solid #0C3320; margin-bottom: 30px; padding-bottom: 10px; }
              h1 { color: #0C3320; margin: 0; font-size: 24px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { text-align: left; background: #f4f4f4; padding: 12px; border-bottom: 2px solid #ddd; }
              .footer { margin-top: 50px; font-size: 12px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <header>
              <h1>MIRALOCKS</h1>
              <p>Planning de la Journée - ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Client</th>
                  <th>Prestation</th>
                  <th>Notes / Suivi</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="footer">Document généré par le système Miralocks Admin</div>
            <script>window.onload = () => { window.print(); window.close(); }</script>
          </body>
          </html>
        `);
        win.document.close();
      } catch (e) {
        showToast("Erreur lors de la génération de l'agenda", "error");
      }
    };

    async function loadDefaultMapStatus() {
      const el = $('default-map-status');
      try {
        const def = await sb.settings.get('default_map') || 'google';
        renderDefaultMapStatus(def);
      } catch (e) {
        renderDefaultMapStatus('google');
      }
    }

    function renderDefaultMapStatus(def) {
      const el = $('default-map-status');
      const isGoogle = def === 'google';
      el.innerHTML = `
    <div style="display:flex;align-items:center;gap:.6rem;padding:.75rem 1rem;
      background:${isGoogle ? '#e8f0fe' : '#1c1c1e10'};
      border:1px solid ${isGoogle ? '#c5d8fd' : '#1c1c1e30'};
      border-radius:8px">
      <i class="${isGoogle ? 'fab fa-google' : 'fab fa-apple'}"
         style="color:${isGoogle ? '#1a73e8' : '#1c1c1e'};font-size:1.1rem"></i>
      <div>
        <strong style="color:${isGoogle ? '#1a56c4' : '#1c1c1e'};font-size:.9rem">
          ${isGoogle ? 'Google Maps' : 'Apple Maps'} affiché par défaut
        </strong>
        <p style="color:#555;font-size:.8rem;margin:.1rem 0 0">
          La page Contact s'ouvre avec ${isGoogle ? 'Google Maps' : 'Apple Maps'} en premier.
        </p>
      </div>
    </div>`;
      // Mettre à jour le style des boutons
      const bG = $('btn-default-google'), bA = $('btn-default-apple');
      if (bG && bA) {
        if (isGoogle) {
          bG.style.cssText += ';background:#1a73e8;color:#fff;border-color:#1a73e8';
          bA.style.cssText += ';background:transparent;color:var(--vert);border-color:currentColor';
        } else {
          bA.style.cssText += ';background:#1c1c1e;color:#fff;border-color:#1c1c1e';
          bG.style.cssText += ';background:transparent;color:var(--vert);border-color:currentColor';
        }
      }
    }

    async function setDefaultMap(type) {
      try {
        await sb.settings.set('default_map', type);
        renderDefaultMapStatus(type);
        toast(`${type === 'google' ? 'Google Maps' : 'Apple Maps'} défini comme carte par défaut`, 'success');
      } catch (e) {
        toast('Erreur : ' + e.message, 'error');
      }
    }

    /* ── Simulation toggle (preview dans admin) ───────────────── */
    let simCurrent = 'google';

    async function loadSimPreview(type) {
      const container = $('sim-map');
      container.innerHTML = '<div class="loading"><div class="spinner"></div> Chargement…</div>';
      simCurrent = type;
      simSetToggle(type);

      if (type === 'google') {
        let customUrl = null;
        try { customUrl = await sb.settings.get('custom_google_iframe_url'); } catch (e) { }
        if (customUrl) {
          container.innerHTML = `
        <iframe style="width:100%;height:220px;border:none;display:block"
          src="${customUrl}"
          loading="lazy" title="Simulation Google Maps"
          referrerpolicy="no-referrer-when-downgrade" allowfullscreen>
        </iframe>`;
        } else {
          container.innerHTML = `
        <iframe style="width:100%;height:220px;border:none;display:block"
          src="https://www.openstreetmap.org/export/embed.html?bbox=1.1834%2C6.2143%2C1.2034%2C6.2343&layer=mapnik&marker=${MAP_LAT}%2C${MAP_LNG}"
          loading="lazy" title="Simulation OpenStreetMap">
        </iframe>`;
        }
      } else {
        container.innerHTML = `
      <iframe style="width:100%;height:220px;border:none;display:block"
        src="https://maps.apple.com/?q=${MAP_LAT},${MAP_LNG}&z=16&t=m&output=embed"
        loading="lazy" title="Simulation Apple Maps"
        sandbox="allow-scripts allow-same-origin allow-popups">
      </iframe>`;
      }
    }

    function simSwitch(type) {
      if (simCurrent === type) return;
      loadSimPreview(type);
    }

    function simSetToggle(type) {
      const bG = $('sim-btn-google'), bA = $('sim-btn-apple');
      if (!bG || !bA) return;
      if (type === 'google') {
        bG.style.background = 'var(--vert)'; bG.style.color = 'var(--or)';
        bA.style.background = 'transparent'; bA.style.color = '#555';
      } else {
        bA.style.background = '#1c1c1e'; bA.style.color = '#fff';
        bG.style.background = 'transparent'; bG.style.color = '#555';
      }
    }

    /* ── PLANNING / CALENDRIER ─────────────────────────────────── */
    let calendar = null;
    async function loadPlanning() {
      const el = document.getElementById('calendar');
      if (!el) return;
      setTimeout(() => {
        if (!calendar) {
          calendar = new FullCalendar.Calendar(el, {
            initialView: 'dayGridMonth',
            locale: 'fr',
            firstDay: 1,
            headerToolbar: {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek'
            },
            buttonText: { today: "Aujourd'hui", month: "Mois", week: "Semaine" },
            events: async function (info, successCallback, failureCallback) {
              try {
                const rdvs = await sb.rdv.list();
                const events = rdvs.map(r => {
                  const st = RDV_STATUTS[r.statut] || RDV_STATUTS.en_attente;
                  return {
                    id: r.id,
                    title: `${r.heure || ''} ${r.nom}`,
                    start: r.date_rdv + (r.heure ? `T${r.heure.replace('h', ':')}:00` : ''),
                    backgroundColor: st.bg,
                    borderColor: st.color,
                    textColor: st.color,
                    extendedProps: r
                  };
                });
                successCallback(events);
              } catch (e) { failureCallback(e); }
            },
            eventClick: function (info) {
              const r = info.event.extendedProps;
              const labels = { en_attente: '⏳ En attente', confirme: '✅ Confirmé', termine: '🏁 Terminé', annule: '❌ Annulé' };
              alert(`${labels[r.statut] || ''}\nClient : ${r.nom}\nService : ${r.service}\nHeure : ${r.heure || 'Non précisée'}\nMessage : ${r.message || ''}`);
            }
          });
          calendar.render();
        } else {
          calendar.refetchEvents();
          calendar.updateSize();
        }
      }, 100);
    }

