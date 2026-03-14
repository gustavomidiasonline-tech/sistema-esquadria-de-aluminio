
-- RLS policies for documentos bucket
CREATE POLICY "Auth users can upload documentos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Auth users can read documentos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documentos');

CREATE POLICY "Auth users can delete documentos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documentos');

-- RLS policies for contratos bucket
CREATE POLICY "Auth users can upload contratos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contratos');

CREATE POLICY "Auth users can read contratos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contratos');

CREATE POLICY "Auth users can delete contratos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contratos');

-- RLS policies for notas-fiscais bucket
CREATE POLICY "Auth users can upload notas-fiscais"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'notas-fiscais');

CREATE POLICY "Auth users can read notas-fiscais"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'notas-fiscais');

CREATE POLICY "Auth users can delete notas-fiscais"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'notas-fiscais');
