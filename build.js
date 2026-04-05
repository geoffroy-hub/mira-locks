#!/usr/bin/env node
/* ============================================================
   Miralocks — build.js
   Script de build : remplace les ?v=XX par un hash court
   basé sur le contenu des fichiers CSS/JS.

   Usage :
     node build.js          → met à jour les ?v= dans tous les HTML
     node build.js --dry    → affiche les changements sans écrire

   Ce script est à lancer avant chaque déploiement.
   ============================================================ */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

const DRY = process.argv.includes('--dry');

/* ── Hash court (8 chars) basé sur le contenu du fichier ── */
function fileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
  } catch {
    return 'xxxxxxxx';
  }
}

/* ── Fichiers à versionner ── */
const ASSETS = [
  'css/styles.css',
  'css/admin.css',
  'js/main.js',
  'js/seo-meta.js',
  'js/lang.js',
  'js/supabase.js',
  'js/supabase2.js',
  'js/admin.js',
  'js/admin-charts.js',
  'js/admin-rdv.js',
  'js/admin-galerie.js',
  'js/admin-avis.js',
  'js/admin-settings.js',
  'js/admin-services.js',
  'js/register-sw.js',
];

/* ── Construire la map asset → hash ── */
const hashes = {};
for (const asset of ASSETS) {
  if (fs.existsSync(asset)) {
    hashes[asset] = fileHash(asset);
    console.log(`  ${asset} → ?v=${hashes[asset]}`);
  }
}

/* ── Remplacer dans tous les HTML ── */
const htmlFiles = fs.readdirSync('.')
  .filter(f => f.endsWith('.html'));

let totalReplacements = 0;

for (const htmlFile of htmlFiles) {
  let content = fs.readFileSync(htmlFile, 'utf-8');
  let changed = false;

  for (const [asset, hash] of Object.entries(hashes)) {
    // Remplace tous les patterns: asset?v=xxx ou asset (sans version)
    const name = asset.replace(/\//g, '\\/');
    // Pattern : src="js/main.js?v=XX" ou href="css/styles.css?v=XX"
    const re = new RegExp(`(["'])${name}(?:\\?v=[^"']*)?(['"])`, 'g');
    const newContent = content.replace(re, (_, q1, q2) => {
      totalReplacements++;
      return `${q1}${asset}?v=${hash}${q2}`;
    });
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    if (!DRY) {
      fs.writeFileSync(htmlFile, content, 'utf-8');
      console.log(`  ✅ ${htmlFile} mis à jour`);
    } else {
      console.log(`  [DRY] ${htmlFile} serait mis à jour`);
    }
  }
}

/* ── Mettre à jour le numéro de cache dans sw.js ── */
if (fs.existsSync('sw.js')) {
  let sw = fs.readFileSync('sw.js', 'utf-8');
  const shortHash = crypto.createHash('md5')
    .update(Object.values(hashes).join(''))
    .digest('hex').slice(0, 6);
  const newSw = sw.replace(
    /const CACHE_V = 'Miralocks-[^']+'/,
    `const CACHE_V = 'Miralocks-${shortHash}'`
  );
  if (newSw !== sw) {
    if (!DRY) {
      fs.writeFileSync('sw.js', newSw, 'utf-8');
      console.log(`  ✅ sw.js: cache version → Miralocks-${shortHash}`);
    } else {
      console.log(`  [DRY] sw.js: cache version → Miralocks-${shortHash}`);
    }
  }
}

console.log(`\n🎉 Build ${DRY ? '(dry-run) ' : ''}terminé — ${totalReplacements} référence(s) mise(s) à jour.`);
