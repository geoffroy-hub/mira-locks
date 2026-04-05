/* ============================================================
   CONFIGURATION DU STOCKAGE VIDÉO — SUPABASE 2
   À exécuter sur le DEUXIÈME projet Supabase
   ============================================================ */

-- 1. Création du bucket "Miralocks-videos" (S'il n'existe pas déjà via l'interface)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('Miralocks-videos', 'Miralocks-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Autoriser tout le monde à VOIR les vidéos (Public)
CREATE POLICY "Accès public en lecture"
ON storage.objects FOR SELECT
USING (bucket_id = 'Miralocks-videos');

-- 3. Autoriser l'upload anonyme (via la clé anon)
-- Note: C'est nécessaire si vous n'utilisez pas de compte utilisateur sur ce 2ème projet
CREATE POLICY "Upload anonyme autorisé"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Miralocks-videos');

-- 4. Autoriser la suppression anonyme (Pour que l'admin puisse supprimer)
CREATE POLICY "Suppression anonyme autorisée"
ON storage.objects FOR DELETE
USING (bucket_id = 'Miralocks-videos');

-- 5. Autoriser la mise à jour (UPDATE)
CREATE POLICY "Mise à jour anonyme autorisée"
ON storage.objects FOR UPDATE
USING (bucket_id = 'Miralocks-videos');
