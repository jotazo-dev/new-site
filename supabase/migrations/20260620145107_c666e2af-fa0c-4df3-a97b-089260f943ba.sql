
-- Status enum
create type public.checkout_status as enum (
  'pending','authorized','paid','failed','canceled','refunded','expired'
);

-- Orders table
create table public.checkout_orders (
  id uuid primary key default gen_random_uuid(),
  merchant_order_id text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  customer jsonb not null,
  items jsonb not null,
  subtotal_cents int not null default 0,
  discount_cents int not null default 0,
  total_cents int not null,
  payment_method text not null check (payment_method in ('credit','debit','pix','boleto')),
  installments int default 1,
  status public.checkout_status not null default 'pending',
  cielo_payment_id text,
  cielo_proof_of_sale text,
  cielo_auth_code text,
  card_brand text,
  card_last4 text,
  pix_qr_code text,
  pix_qr_string text,
  pix_expires_at timestamptz,
  boleto_url text,
  boleto_digitable_line text,
  boleto_bar_code text,
  boleto_due_date date,
  authentication_url text,
  return_url text,
  customer_email text,
  notification_sent_at timestamptz,
  last_error jsonb,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_checkout_orders_user on public.checkout_orders(user_id);
create index idx_checkout_orders_payment on public.checkout_orders(cielo_payment_id);
create index idx_checkout_orders_status on public.checkout_orders(status);
create index idx_checkout_orders_created on public.checkout_orders(created_at desc);

grant select, insert on public.checkout_orders to authenticated;
grant select, insert on public.checkout_orders to anon;
grant all on public.checkout_orders to service_role;

alter table public.checkout_orders enable row level security;

create policy "Owner reads own order"
on public.checkout_orders for select
to authenticated
using (user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role));

create policy "Anyone creates order (guest checkout)"
on public.checkout_orders for insert
to anon, authenticated
with check (true);

-- Updates only via service_role (edges/webhooks). No client-side update policy.

-- Trigger for updated_at
create trigger trg_checkout_orders_updated
before update on public.checkout_orders
for each row execute function public.update_updated_at_column();

-- Events table (timeline)
create table public.checkout_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.checkout_orders(id) on delete cascade,
  source text not null check (source in ('webhook','poll','manual','create')),
  cielo_status int,
  cielo_change_type int,
  payload jsonb,
  message text,
  created_at timestamptz not null default now()
);

create index idx_checkout_events_order on public.checkout_events(order_id, created_at desc);

grant select on public.checkout_events to authenticated;
grant all on public.checkout_events to service_role;

alter table public.checkout_events enable row level security;

create policy "Owner reads own order events"
on public.checkout_events for select
to authenticated
using (
  exists (
    select 1 from public.checkout_orders o
    where o.id = checkout_events.order_id
      and (o.user_id = auth.uid() or has_role(auth.uid(), 'admin'::app_role))
  )
);
