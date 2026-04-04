
CREATE TABLE public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sequential_id integer NOT NULL,
  entity_name text NOT NULL,
  geolocation text,
  is_parent boolean NOT NULL DEFAULT false,
  children integer[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to entities"
  ON public.entities
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
