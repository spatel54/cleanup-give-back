-- Checkpoint GPS for trail photo pins on admin/web-app maps.
-- Future sessions store the volunteer location when selfie+progress are submitted.
-- Existing rows keep NULL lat/lng; web-app falls back to time-along-route placement.

alter table public.checkpoints
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

comment on column public.checkpoints.latitude is
  'WGS84 latitude at photo capture (nullable for legacy checkpoints)';
comment on column public.checkpoints.longitude is
  'WGS84 longitude at photo capture (nullable for legacy checkpoints)';
