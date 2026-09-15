-- Multiple registration/hero photos per event (Admin multi-upload).
-- `image_url` stays as the primary/first photo for list cards and older clients.

alter table public.events
  add column if not exists image_urls text[] not null default '{}';

-- Backfill single-hero rows into the gallery array.
update public.events
set image_urls = array[image_url]
where image_url is not null
  and image_url <> ''
  and (image_urls is null or cardinality(image_urls) = 0);
