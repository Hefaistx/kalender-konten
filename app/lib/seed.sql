INSERT INTO users (name, role) VALUES
  ('Anggri', 'tim_multimedia'),
  ('Putri',  'tim_sosmed'),
  ('Sikin',  'tim_sosmed'),
  ('Dede',   'manager'),
  ('Eka',    'head');

INSERT INTO master_akun (nama) VALUES
  ('DP'),
  ('DJ');

INSERT INTO master_platform (nama) VALUES
  ('Meta Ads'),
  ('Tiktok Ads');

INSERT INTO master_pic (nama) VALUES
  ('Anggri'),
  ('Putri'),
  ('Sikin');

INSERT INTO master_jenis_konten (nama) VALUES
  ('Video Reel'),
  ('Desain Grafis');

-- Video Reel → Anggri (pic id 1)
-- Desain Grafis → Putri (pic id 2), Sikin (pic id 3)
INSERT INTO master_jenis_konten_pic (jenis_konten_id, pic_id)
SELECT j.id, p.id FROM master_jenis_konten j, master_pic p
WHERE (j.nama = 'Video Reel'    AND p.nama = 'Anggri')
   OR (j.nama = 'Desain Grafis' AND p.nama IN ('Putri', 'Sikin'));

INSERT INTO master_target_insight (nama) VALUES
  ('CTA'),
  ('Reach');

INSERT INTO master_tipe_konten (nama) VALUES
  ('Informatif'),
  ('Intermezzo'),
  ('Softselling'),
  ('Hardselling'),
  ('Carousel Informatif');

INSERT INTO master_properti (nama, kota) VALUES
  ('D''PARAGON PAMELA 1',                            'YOGYAKARTA'),
  ('D''PARAGON PAMELA 2',                            'YOGYAKARTA'),
  ('D''PARAGON PAMELA 3',                            'YOGYAKARTA'),
  ('D''PARAGON PAMELA 4',                            'YOGYAKARTA'),
  ('D''PARAGON TAMBAKBOYO',                          'YOGYAKARTA'),
  ('D''PARAGON CERRY',                               'YOGYAKARTA'),
  ('D''PARAGON POGUNG F',                            'YOGYAKARTA'),
  ('D''PARAGON KEMUNING',                            'YOGYAKARTA'),
  ('D''PARAGON PERUMNAS',                            'YOGYAKARTA'),
  ('D''PARAGON BEO',                                 'YOGYAKARTA'),
  ('D''PARAGON KUSUMANEGARA',                        'YOGYAKARTA'),
  ('D''PARAGON SETURAN 1',                           'YOGYAKARTA'),
  ('D''PARAGON SETURAN 2',                           'YOGYAKARTA'),
  ('D''PARAGON SETURAN 3',                           'YOGYAKARTA'),
  ('D''PARAGON SETURAN 4',                           'YOGYAKARTA'),
  ('D''PARAGON KARANGMALANG',                        'YOGYAKARTA'),
  ('D''PARAGON FLAMBOYAN',                           'YOGYAKARTA'),
  ('D''PARAGON PELEM KECUT',                         'YOGYAKARTA'),
  ('D''PARAGON PRINGWULUNG',                         'YOGYAKARTA'),
  ('D''PARAGON UPN',                                 'YOGYAKARTA'),
  ('D''PARAGON POGUNG B',                            'YOGYAKARTA'),
  ('D''PARAGON CORE',                                'YOGYAKARTA'),
  ('D''PARAGON UTTARA',                              'YOGYAKARTA'),
  ('D''PARAGON MALIOBORO',                           'YOGYAKARTA'),
  ('DJURAGAN KAMAR KAYON',                           'YOGYAKARTA'),
  ('DJURAGAN KAMAR AYEM',                            'YOGYAKARTA'),
  ('DJURAGAN KAMAR MALIOBORO CITY C-103',            'YOGYAKARTA'),
  ('DJURAGAN KAMAR PAMELA 3',                        'YOGYAKARTA'),
  ('Head Quarter Royal Dparagon Land',               'YOGYAKARTA'),
  ('DJURAGAN KAMAR UTTARA',                          'YOGYAKARTA'),
  ('DJURAGAN KAMAR LAKSMITA SYARIAH',                'YOGYAKARTA'),
  ('DJURAGAN KAMAR HALONA',                          'YOGYAKARTA'),
  ('D''KRATON VILLA',                                'YOGYAKARTA'),
  ('MANAJEMEN DJURAGAN KAMAR',                       'YOGYAKARTA'),
  ('MANAJEMEN DPARAGON',                             'YOGYAKARTA'),
  ('DJURAGAN KAMAR RUMAH PRESISI',                   'YOGYAKARTA'),
  ('DJURAGAN KAMAR CAKALA',                          'YOGYAKARTA'),
  ('DJURAGAN KAMAR BILBA',                           'YOGYAKARTA'),
  ('DJURAGAN KAMAR PONDOK TAMSIS',                   'YOGYAKARTA'),
  ('JEDE',                                           'YOGYAKARTA'),
  ('K24',                                            'YOGYAKARTA'),
  ('Simbil',                                         'YOGYAKARTA'),
  ('Properti Donasi',                                'YOGYAKARTA'),
  ('D''PARAGON BUKIT SARI',                          'SEMARANG'),
  ('D''PARAGON KIJANG UTARA',                        'SEMARANG'),
  ('D''PARAGON JALAN JOGJA',                         'SEMARANG'),
  ('D''PARAGON MT. HARYONO',                         'SEMARANG'),
  ('D''PARAGON BULUSAN',                             'SEMARANG'),
  ('DJURAGAN KAMAR DE JAPAN SEMARANG',               'SEMARANG'),
  ('DJURAGAN KAMAR AMALFI PAPANDAYAN',               'SEMARANG'),
  ('DJURAGAN KAMAR AMALFI RESIDENCE LABUHAN',        'SEMARANG'),
  ('DJURAGAN KAMAR TIARA',                           'KABUPATEN SEMARANG'),
  ('DJURAGAN KAMAR WISMA HUSADA',                    'KABUPATEN SEMARANG'),
  ('D''PARAGON SUMBER',                              'SOLO'),
  ('D''PARAGON MANDURO',                             'SOLO'),
  ('D''PARAGON KERTEN',                              'SOLO'),
  ('DJURAGAN KAMAR BELLA NINE GUESTHOUSE EKSKLUSIF', 'SOLO'),
  ('DJURAGAN KAMAR DE MANGKOE',                      'SOLO'),
  ('D''PARAGON MEDOKAN AYU',                         'SURABAYA'),
  ('D''PARAGON KALIJUDAN',                           'SURABAYA'),
  ('DJURAGAN KAMAR GUNUNG ANYAR',                    'SURABAYA'),
  ('D''PARAGON KEBONJERUK',                          'JAKARTA'),
  ('D''PARAGON GAJAH MADA',                          'JAKARTA'),
  ('D''PARAGON MENTENG',                             'JAKARTA'),
  ('D''PARAGON MATRAMAN',                            'JAKARTA'),
  ('D''PARAGON SENOPATI',                            'JAKARTA'),
  ('DJURAGAN KAMAR CIRAGIL',                         'JAKARTA'),
  ('DJURAGAN KAMAR SLIPI',                           'JAKARTA'),
  ('DJURAGAN KAMAR MANGGA BESAR',                    'JAKARTA'),
  ('D''PARAGON BUKIT DIENG',                         'MALANG'),
  ('D''PARAGON IJEN NIRWANA',                        'MALANG'),
  ('D''PARAGON SONGGOLANGIT',                        'MALANG'),
  ('DJURAGAN KAMAR BANDAHARA',                       'MALANG'),
  ('DJURAGAN KAMAR SUHAT',                           'MALANG'),
  ('DJURAGAN KAMAR BALAWAN',                         'MALANG'),
  ('D''PARAGON TRIKORA',                             'PALEMBANG'),
  ('D''PARAGON DWIKORA',                             'PALEMBANG'),
  ('DJURAGAN KAMAR MACAN KUMBANG',                   'PALEMBANG'),
  ('DJURAGAN KAMAR HOTEL PANGERAN',                  'PALEMBANG'),
  ('D''PARAGON VETERAN',                             'BANJARMASIN'),
  ('DJURAGAN KAMAR GATSU',                           'BANJARMASIN'),
  ('DJURAGAN KAMAR LAMBUNG MANGKURAT',               'BANJARMASIN'),
  ('DJURAGAN KAMAR TASIK',                           'KABUPATEN BANTUL'),
  ('CAMPAGNA',                                       'KABUPATEN SLEMAN');
