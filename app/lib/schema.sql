DROP TABLE IF EXISTS konten_platform CASCADE;
DROP TABLE IF EXISTS konten_target_insights CASCADE;
DROP TABLE IF EXISTS konten_properti CASCADE;
DROP TABLE IF EXISTS konten_approvals CASCADE;
DROP TABLE IF EXISTS konten_uploads CASCADE;
DROP TABLE IF EXISTS konten CASCADE;
DROP TABLE IF EXISTS master_jenis_konten_pic CASCADE;
DROP TABLE IF EXISTS master_tipe_konten CASCADE;
DROP TABLE IF EXISTS master_properti CASCADE;
DROP TABLE IF EXISTS master_akun CASCADE;
DROP TABLE IF EXISTS master_platform CASCADE;
DROP TABLE IF EXISTS master_jenis_konten CASCADE;
DROP TABLE IF EXISTS master_target_insight CASCADE;
DROP TABLE IF EXISTS master_pic CASCADE;
DROP TABLE IF EXISTS master_lokasi CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL
);

CREATE TABLE master_akun (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE master_platform (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE master_pic (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE master_jenis_konten (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE master_jenis_konten_pic (
  jenis_konten_id INT REFERENCES master_jenis_konten(id) ON DELETE CASCADE,
  pic_id          INT REFERENCES master_pic(id) ON DELETE CASCADE,
  PRIMARY KEY (jenis_konten_id, pic_id)
);

CREATE TABLE master_target_insight (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE master_tipe_konten (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE master_properti (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(200) NOT NULL,
  kota VARCHAR(100) NOT NULL
);

CREATE TABLE konten (
  id SERIAL PRIMARY KEY,
  judul VARCHAR(255) NOT NULL,
  tanggal_tayang DATE NOT NULL,
  tanggal_produksi DATE,
  akun_id INT REFERENCES master_akun(id),
  platform_id INT REFERENCES master_platform(id),
  jenis_konten_id INT REFERENCES master_jenis_konten(id),
  tipe_konten_id INT REFERENCES master_tipe_konten(id),
  pic_id INT REFERENCES master_pic(id),
  tipe_lokasi VARCHAR(20),
  lokasi_kota VARCHAR(100),
  workflow_status VARCHAR(50) NOT NULL DEFAULT 'to_do',
  referensi_konten TEXT,
  materi TEXT,
  catatan TEXT,
  link_konten TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE konten_platform (
  konten_id   INT REFERENCES konten(id) ON DELETE CASCADE,
  platform_id INT REFERENCES master_platform(id),
  PRIMARY KEY (konten_id, platform_id)
);

CREATE TABLE konten_target_insights (
  konten_id         INT REFERENCES konten(id) ON DELETE CASCADE,
  target_insight_id INT REFERENCES master_target_insight(id),
  PRIMARY KEY (konten_id, target_insight_id)
);

CREATE TABLE konten_properti (
  konten_id   INT REFERENCES konten(id) ON DELETE CASCADE,
  properti_id INT REFERENCES master_properti(id),
  PRIMARY KEY (konten_id, properti_id)
);

CREATE TABLE konten_uploads (
  id               SERIAL PRIMARY KEY,
  konten_id        INT REFERENCES konten(id) ON DELETE CASCADE,
  uploader_user_id INT REFERENCES users(id),
  tipe             VARCHAR(30) NOT NULL,
  bukti            TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE konten_approvals (
  id               SERIAL PRIMARY KEY,
  konten_id        INT REFERENCES konten(id) ON DELETE CASCADE,
  approver_user_id INT REFERENCES users(id),
  tipe             VARCHAR(30) NOT NULL,
  action           VARCHAR(10) NOT NULL,
  alasan           TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
