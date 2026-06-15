-- Migration: Simplify master_platform
-- Before: 8 static entries (Meta Ads - Kota, Meta Ads - Global, etc.)
-- After:  2 entries (Meta Ads, Tiktok Ads) — tipe_lokasi stored separately on konten

-- Step 1: Insert simplified platform entries
INSERT INTO master_platform (nama) VALUES ('Meta Ads')  ON CONFLICT (nama) DO NOTHING;
INSERT INTO master_platform (nama) VALUES ('Tiktok Ads') ON CONFLICT (nama) DO NOTHING;

-- Step 2: Re-point existing konten rows to the simplified entries
UPDATE konten
SET platform_id = (SELECT id FROM master_platform WHERE nama = 'Meta Ads')
WHERE platform_id IN (
  SELECT id FROM master_platform WHERE nama LIKE 'Meta Ads - %'
);

UPDATE konten
SET platform_id = (SELECT id FROM master_platform WHERE nama = 'Tiktok Ads')
WHERE platform_id IN (
  SELECT id FROM master_platform WHERE nama LIKE 'Tiktok Ads - %'
);

-- Step 3: Remove old static entries
DELETE FROM master_platform
WHERE nama LIKE 'Meta Ads - %' OR nama LIKE 'Tiktok Ads - %';

-- Step 4: Create konten_platform junction table
CREATE TABLE IF NOT EXISTS konten_platform (
  konten_id   INT REFERENCES konten(id) ON DELETE CASCADE,
  platform_id INT REFERENCES master_platform(id),
  PRIMARY KEY (konten_id, platform_id)
);

-- Step 5: Migrate existing konten.platform_id → konten_platform
INSERT INTO konten_platform (konten_id, platform_id)
SELECT id, platform_id FROM konten
WHERE platform_id IS NOT NULL
ON CONFLICT DO NOTHING;
