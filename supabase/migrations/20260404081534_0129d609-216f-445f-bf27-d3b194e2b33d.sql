
CREATE TABLE public.audit_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  review_period TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT NOT NULL,
  file_type TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.org_chart_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_chart_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to audit_files" ON public.audit_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to org_chart_files" ON public.org_chart_files FOR ALL USING (true) WITH CHECK (true);
