-- Table definition for telemetry data
create table public.telemetry (
  id uuid primary key default uuid_generate_v4(),
  received_at timestamptz default now(),
  payload jsonb
);

-- Policy to allow insertion of telemetry data
create policy "allow insert" on telemetry
for insert with check (true);

-- Add necessary indices
create index telemetry_received_at_idx on telemetry(received_at);
create index telemetry_payload_device_id_idx on telemetry((payload->>'deviceId'));
create index telemetry_payload_model_idx on telemetry((payload->>'model'));
create index telemetry_payload_os_idx on telemetry((payload->>'os'));

-- Retention policy (optional) - automatically delete data older than 90 days
-- Uncomment when ready to implement
-- create function delete_old_telemetry() returns trigger as $$
-- begin
--   delete from telemetry where received_at < now() - interval '90 days';
--   return null;
-- end;
-- $$ language plpgsql;

-- create trigger delete_old_telemetry_trigger
--   after insert on telemetry
--   execute procedure delete_old_telemetry();
