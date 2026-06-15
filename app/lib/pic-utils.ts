export const PIC_JABATAN: Record<string, string> = {
  Anggri: 'Tim Multimedia',
  Putri: 'Tim Sosmed',
  Sikin: 'Tim Sosmed',
};

const USER_JABATAN: Record<string, string> = {
  ...PIC_JABATAN,
  Eka: 'Head',
  'Eka Saputra': 'Head',
  Dede: 'Manager',
  'Dede Kurniawan': 'Manager',
};

export function formatPicLabel(nama: string | null | undefined): string {
  if (!nama) return '-';
  const jabatan = PIC_JABATAN[nama];
  return jabatan ? `${nama} - ${jabatan}` : nama;
}

export function formatUserLabel(nama: string | null | undefined): string {
  if (!nama) return '-';
  const jabatan = USER_JABATAN[nama];
  return jabatan ? `${nama} - ${jabatan}` : nama;
}
