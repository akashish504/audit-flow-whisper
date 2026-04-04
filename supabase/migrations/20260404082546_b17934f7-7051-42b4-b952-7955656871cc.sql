
CREATE TABLE public.audit_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Review',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to audit_periods" ON public.audit_periods FOR ALL USING (true) WITH CHECK (true);
