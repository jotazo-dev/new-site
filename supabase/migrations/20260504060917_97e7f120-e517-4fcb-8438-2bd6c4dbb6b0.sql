-- Remove o valor do "Serviço de Roaming" embutido no preço dos planos chip 5G e Black Chip.
-- A coluna combo_price_cents (valor promocional do combo) é mantida.

-- 5G
UPDATE public.plans SET price_cents = price_cents - 1000, original_price_cents = GREATEST(0, original_price_cents - 1000) WHERE id = 'cededac0-a235-4db8-bd17-9c440226e2f5';
UPDATE public.plans SET price_cents = price_cents - 1390, original_price_cents = GREATEST(0, original_price_cents - 1390) WHERE id = 'e7cf6abe-16c9-47f6-ad65-b43311f49b69';
UPDATE public.plans SET price_cents = price_cents - 1640, original_price_cents = GREATEST(0, original_price_cents - 1640) WHERE id = 'e8a1e9a7-9175-4bdc-836d-9040092935aa';
UPDATE public.plans SET price_cents = price_cents - 2000, original_price_cents = GREATEST(0, original_price_cents - 2000) WHERE id = 'a3dea905-5e77-4a31-88c6-e096a055e85c';
UPDATE public.plans SET price_cents = price_cents - 2290, original_price_cents = GREATEST(0, original_price_cents - 2290) WHERE id = 'c15d8fc3-fb97-4acb-ab51-d0fdab148744';
UPDATE public.plans SET price_cents = price_cents - 3490, original_price_cents = GREATEST(0, original_price_cents - 3490) WHERE id = '42a6bed6-7d09-401f-829d-837aa22a5555';

-- Black
UPDATE public.plans SET price_cents = price_cents -  800, original_price_cents = GREATEST(0, original_price_cents -  800) WHERE id = '665c6926-d371-4889-8c6d-1d974d121f5c';
UPDATE public.plans SET price_cents = price_cents - 1095, original_price_cents = GREATEST(0, original_price_cents - 1095) WHERE id = '0d703963-053b-4da5-97b4-63fc595bfca5';
UPDATE public.plans SET price_cents = price_cents - 1300, original_price_cents = GREATEST(0, original_price_cents - 1300) WHERE id = '56c0e5fa-0a2a-4e87-bc86-b6c2588af265';
UPDATE public.plans SET price_cents = price_cents - 1700, original_price_cents = GREATEST(0, original_price_cents - 1700) WHERE id = '166bfdad-0ef4-49a3-892c-9503f3764c5b';
UPDATE public.plans SET price_cents = price_cents - 2000, original_price_cents = GREATEST(0, original_price_cents - 2000) WHERE id = 'f382c185-673a-4ff2-abe0-507b65235a44';
UPDATE public.plans SET price_cents = price_cents - 2100, original_price_cents = GREATEST(0, original_price_cents - 2100) WHERE id = '480a6483-5fe2-475d-a3e3-c7f762602466';

-- Remove os planos "Serviço de Roaming" (type=voz)
DELETE FROM public.plans WHERE category = 'movel' AND type = 'voz';