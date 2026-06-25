-- Validações para crm_leads (proteção contra flood de bots)
ALTER TABLE public.crm_leads
  ADD CONSTRAINT crm_leads_name_length CHECK (char_length(customer_name) BETWEEN 2 AND 200),
  ADD CONSTRAINT crm_leads_email_length CHECK (customer_email IS NULL OR char_length(customer_email) <= 320),
  ADD CONSTRAINT crm_leads_email_format CHECK (customer_email IS NULL OR customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT crm_leads_phone_length CHECK (customer_phone IS NULL OR char_length(customer_phone) <= 20),
  ADD CONSTRAINT crm_leads_notes_length CHECK (char_length(notes) <= 2000),
  ADD CONSTRAINT crm_leads_cep_length CHECK (char_length(cep) <= 20),
  ADD CONSTRAINT crm_leads_city_length CHECK (char_length(city) <= 100),
  ADD CONSTRAINT crm_leads_street_length CHECK (char_length(street) <= 200);

-- Validações para resumes (proteção contra flood de bots)
ALTER TABLE public.resumes
  ADD CONSTRAINT resumes_name_length CHECK (char_length(name) BETWEEN 2 AND 200),
  ADD CONSTRAINT resumes_email_length CHECK (char_length(email) <= 320),
  ADD CONSTRAINT resumes_email_format CHECK (email = '' OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  ADD CONSTRAINT resumes_phone_length CHECK (char_length(phone) <= 20),
  ADD CONSTRAINT resumes_message_length CHECK (char_length(message) <= 2000),
  ADD CONSTRAINT resumes_position_length CHECK (char_length(position) <= 100),
  ADD CONSTRAINT resumes_file_name_length CHECK (char_length(file_name) <= 255),
  ADD CONSTRAINT resumes_file_ext CHECK (file_path = '' OR file_path ~* '\.(pdf|doc|docx)$');