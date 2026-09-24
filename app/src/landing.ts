// Product page: platform-aware install button, QR code for desktop visitors.
import qrcode from 'qrcode-generator';
import { registerSW } from 'virtual:pwa-register';
import './organic.css';
import './theme.css';
import './landing.css';

registerSW({ immediate: true });

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const ua = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
document.body.dataset.platform = platform;

// Put the visitor's own platform first and highlight it.
const ways = document.querySelector('.ways');
const mine = document.querySelector<HTMLElement>(`.way[data-for=${platform}]`);
if (ways && mine) { ways.prepend(mine); mine.classList.add('mine'); }

const hint = document.querySelector('[data-hint]');
if (hint && isIOS) hint.textContent = 'On iPhone: open in Safari, tap Share, then Add to Home Screen.';
if (hint && platform === 'desktop') hint.textContent = 'On a computer? Scan the QR code below with your phone.';

// Android/Chrome: the browser hands us an install prompt; the buttons trigger it directly.
// It may arrive before this script runs (caught inline in index.html), later, or never:
// Chrome waits until the visitor has tapped the page and stayed ~30 seconds.
const w = window as Window & { __installPrompt?: InstallPrompt };
let deferred: InstallPrompt | null = w.__installPrompt || null;
const heroBtn = document.querySelector<HTMLAnchorElement>('[data-install]')!;
const wayBtn = document.querySelector<HTMLButtonElement>('[data-install-btn]')!;
const how = document.querySelector<HTMLDialogElement>('[data-how]')!;
const howBtn = document.querySelector<HTMLButtonElement>('[data-how-install]')!;
let isInstalled = false;

async function prompt() {
  if (!deferred) return;
  const p = deferred;
  deferred = null; // a prompt can only be shown once
  await p.prompt();
  if ((await p.userChoice).outcome === 'accepted') installed();
}
function install(e: Event) {
  if (isInstalled) return; // the button is a plain link to the app now
  if (deferred) { e.preventDefault(); prompt(); return; }
  if (isAndroid) { e.preventDefault(); how.showModal(); } // Chrome not ready: show the menu route
  // elsewhere the hero link scrolls to the steps for this device
}
function ready() {
  wayBtn.hidden = false;
  howBtn.hidden = false;
  document.querySelector('[data-android-steps]')?.setAttribute('hidden', '');
}
function installed() {
  isInstalled = true;
  how.close();
  for (const b of [heroBtn, wayBtn]) b.textContent = 'Open Envelope';
  heroBtn.setAttribute('href', 'app/');
  wayBtn.onclick = () => location.assign('app/');
  wayBtn.hidden = false;
}

if (deferred) ready();
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferred = e as InstallPrompt;
  ready();
});
addEventListener('appinstalled', installed);
heroBtn.addEventListener('click', install);
wayBtn.addEventListener('click', install);
howBtn.addEventListener('click', () => { how.close(); prompt(); });
how.addEventListener('click', e => { if (e.target === how) how.close(); }); // tap outside closes
document.querySelector('[data-how-close]')?.addEventListener('click', () => how.close());

// Already installed on this phone? Offer to open it instead.
const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> };
nav.getInstalledRelatedApps?.().then(apps => { if (apps.length) installed(); }).catch(() => {});

// QR code pointing at this page's install section.
const qrEl = document.querySelector('[data-qr]');
if (qrEl) {
  const qr = qrcode(0, 'M');
  qr.addData(location.href.split('#')[0] + '#install');
  qr.make();
  qrEl.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
