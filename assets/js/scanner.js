/**
 * scanner.js — Scanner QR + input manual (dipakai index.html)
 * Membutuhkan library html5-qrcode (dimuat sebelum file ini).
 */
const CARD_BASE = 'card.html';

let scanner  = null;
let scanning = false;

function $(id) { return document.getElementById(id); }

function gotoCard(id) {
  window.location.href = `${CARD_BASE}?id=${encodeURIComponent(id)}`;
}

function onScanSuccess(decodedText) {
  // QR bisa berisi ID saja atau URL penuh (card.html?id=xxxx)
  let id = decodedText.trim();
  try {
    const u = new URL(decodedText);
    id = u.searchParams.get('id') || id;
  } catch (_) { /* bukan URL, pakai teks apa adanya */ }

  if (navigator.vibrate) navigator.vibrate(100);
  stopScanner(() => gotoCard(id));
}

function startScanner() {
  scanner = new Html5Qrcode('reader');
  scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    onScanSuccess,
    () => {} // abaikan frame yang gagal dibaca
  ).then(() => {
    scanning = true;
    $('cam-label').textContent  = 'Kamera aktif — arahkan ke QR code';
    $('cam-toggle').textContent = '⏹ Hentikan Kamera';
  }).catch(() => {
    $('cam-label').textContent = 'Kamera tidak tersedia — gunakan input manual';
    $('scanner-wrap').style.display = 'none';
    $('cam-toggle').style.display   = 'none';
  });
}

function stopScanner(cb) {
  if (scanner && scanning) {
    scanner.stop().then(() => {
      scanning = false;
      $('cam-toggle').textContent = '▶ Aktifkan Kamera';
      $('cam-label').textContent  = 'Kamera dihentikan';
      if (cb) cb();
    }).catch(() => { if (cb) cb(); });
  } else if (cb) {
    cb();
  }
}

function toggleScanner() {
  if (scanning) stopScanner();
  else startScanner();
}

function goToCard(e) {
  e.preventDefault();
  const input = $('manual-id');
  const id = input.value.trim();
  if (!id) { input.focus(); return; }
  gotoCard(id);
}

window.addEventListener('load', startScanner);
