
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Pending Review',
  audit_period TEXT,
  contact_email TEXT,
  contact_name TEXT,
  has_audit_report BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  entity_status TEXT,
  geolocation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update audit_files and org_chart_files to reference companies
ALTER TABLE public.audit_files
  ALTER COLUMN company_id TYPE UUID USING company_id::uuid,
  ADD CONSTRAINT fk_audit_files_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.org_chart_files
  ALTER COLUMN company_id TYPE UUID USING company_id::uuid,
  ADD CONSTRAINT fk_org_chart_files_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to companies" ON public.companies FOR ALL USING (true) WITH CHECK (true);
