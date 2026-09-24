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
let deferred: InstallPrompt | null = null;
const heroBtn = document.querySelector<HTMLAnchorElement>('[data-install]')!;
const wayBtn = document.querySelector<HTMLButtonElement>('[data-install-btn]')!;

async function install(e: Event) {
  if (!deferred) return; // no prompt: the hero link just scrolls to the steps
  e.preventDefault();
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  if (outcome === 'accepted') installed();
}
function installed() {
  for (const b of [heroBtn, wayBtn]) {
    b.textContent = 'Open Khata';
    b.onclick = () => location.assign('app/');
  }
  heroBtn.setAttribute('href', 'app/');
  wayBtn.hidden = false;
}

addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferred = e as InstallPrompt;
  wayBtn.hidden = false;
  document.querySelector('[data-android-steps]')?.setAttribute('hidden', '');
});
addEventListener('appinstalled', installed);
heroBtn.addEventListener('click', install);
wayBtn.addEventListener('click', install);

// QR code pointing at this page's install section.
const qrEl = document.querySelector('[data-qr]');
if (qrEl) {
  const qr = qrcode(0, 'M');
  qr.addData(location.href.split('#')[0] + '#install');
  qr.make();
  qrEl.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
