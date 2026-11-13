/**
 * main.js — Fetch & render kartu siswa (dipakai card.html)
 */

// Ganti dengan URL deploy Apps Script kamu
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbw1PAom_CJh-UXofJ_pK5zDxwjffxl9Epqdmvym-MsJoxsGKnz6vhhwy3aBV2r-ScLDEQ/exec';

const DEFAULT_PHOTO = 'assets/default.svg';

const KOMPETENSIS = [
  { key: 'kompetensi_kedisiplinan', label: 'Kedisiplinan' },
  { key: 'kompetensi_kepemimpinan', label: 'Kepemimpinan' },
  { key: 'kompetensi_kerajinan',    label: 'Kerajinan'    },
  { key: 'kompetensi_publikasi',    label: 'Publikasi'    },
];

function el(id) { return document.getElementById(id); }

/** Ubah nilai sel apa pun (angka/teks/null) menjadi string rapi. */
function clean(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

function showError(title, msg) {
  el('loading').style.display    = 'none';
  el('card-view').style.display  = 'none';
  el('error-view').style.display = 'flex';
  el('error-title').textContent  = title || 'Terjadi Kesalahan';
  el('error-msg').textContent    = msg   || '';
}

function showCard() {
  el('loading').style.display    = 'none';
  el('error-view').style.display = 'none';
  el('card-view').style.display  = 'block';
}

function renderKompetensi(data) {
  const list = el('competency-list');
  list.innerHTML = '';

  KOMPETENSIS.forEach(({ key, label }) => {
    const rawStr = clean(data[key]);
    const num    = rawStr !== '' ? Number(rawStr) : NaN;
    const valid  = Number.isFinite(num);
    const pct    = valid ? Math.min(100, Math.max(0, num)) : 0;

    const item = document.createElement('div');
    item.className = 'comp-item';

    const lbl = document.createElement('span');
    lbl.className   = 'comp-label';
    lbl.textContent = label;

    const wrap = document.createElement('div');
    wrap.className = 'comp-bar-wrap';
    const bar = document.createElement('div');
    bar.className   = 'comp-bar';
    bar.style.width = '0%';
    bar.dataset.pct = pct;
    wrap.appendChild(bar);

    const val = document.createElement('span');
    val.className   = 'comp-val';
    val.textContent = valid ? num : '—';

    item.append(lbl, wrap, val);
    list.appendChild(item);
  });

  // Animasi bar setelah render
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      list.querySelectorAll('.comp-bar').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
    });
  });
}

async function loadCard() {
  const id = clean(new URLSearchParams(location.search).get('id'));

  if (!id) {
    showError('ID Tidak Ditemukan', 'URL tidak mengandung parameter id. Kembali ke scanner dan coba lagi.');
    return;
  }

  try {
    const url = `${ENDPOINT}?id=${encodeURIComponent(id)}`;

    // PENTING: jangan set mode:'cors'.
    // Apps Script me-redirect ke URL eksekusi baru; mode:'cors' membuat
    // preflight pada redirect gagal dan fetch error tanpa pesan jelas.
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    if (!json.success) {
      showError('Data Tidak Ditemukan', `Siswa dengan ID "${id}" tidak terdaftar dalam sistem.`);
      return;
    }

    const d = json.data;

    // Foto — pasang handler error SEBELUM mengubah src
    const photo = el('photo');
    const fotoUrl = clean(d.foto_url);
    photo.onerror = () => {
      photo.onerror = null; // cegah loop jika fallback ikut gagal
      photo.src = DEFAULT_PHOTO;
    };
    photo.src = fotoUrl || DEFAULT_PHOTO;

    el('nama').textContent            = clean(d.nama)        || '—';
    el('kelas').textContent           = clean(d.kelas)       || '—';
    el('nomor-induk').textContent     = clean(d.nomor_induk) || '—';
    el('student-id-chip').textContent = clean(d.student_id)  || id;

    // Catatan (aman untuk sel berisi angka/kosong)
    const catatanEl = el('catatan');
    const catatan   = clean(d.catatan);
    if (catatan) {
      catatanEl.textContent = catatan;
      catatanEl.classList.remove('empty');
    } else {
      catatanEl.textContent = 'Tidak ada catatan.';
      catatanEl.classList.add('empty');
    }

    renderKompetensi(d);
    document.title = `Kartu Siswa — ${clean(d.nama) || id}`;
    showCard();

  } catch (err) {
    console.error(err);
    showError(
      'Gagal Mengambil Data',
      'Pastikan koneksi internet aktif dan Apps Script sudah di-deploy ulang dengan akses "Anyone". Detail: ' + err.message
    );
  }
}

window.addEventListener('DOMContentLoaded', loadCard);
