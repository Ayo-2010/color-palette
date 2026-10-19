const STORE_KEY = 'palette.saved';
const SWATCH_COUNT = 5;

const paletteEl = document.getElementById('palette');
const generateBtn = document.getElementById('generateBtn');
const saveBtn = document.getElementById('saveBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const savedList = document.getElementById('savedList');
const savedEmpty = document.getElementById('savedEmpty');
const clearSaved = document.getElementById('clearSaved');
const toast = document.getElementById('toast');

let colors = [];
let locks = [false, false, false, false, false];
let format = 'hex';
let saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');

function randomHue() {
  return Math.floor(Math.random() * 360);
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function generateColor() {
  const hue = randomHue();
  const sat = 55 + Math.random() * 30;
  const light = 40 + Math.random() * 28;
  return hslToHex(hue, sat, light);
}

function generatePalette() {
  colors = colors.length
    ? colors.map((c, i) => (locks[i] ? c : generateColor()))
    : Array.from({ length: SWATCH_COUNT }, generateColor);
  renderPalette();
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function formatColor(hex) {
  return format === 'hex' ? hex : hexToRgb(hex);
}

function textColor(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111' : '#fff';
}

function renderPalette() {
  paletteEl.innerHTML = '';
  colors.forEach((hex, i) => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.animationDelay = `${i * 60}ms`;
    swatch.innerHTML = `
      <div class="swatch-color" style="background:${hex}; color:${textColor(hex)}" data-copy="${hex}">
        <span class="swatch-code">${formatColor(hex)}</span>
      </div>
      <div class="swatch-bar">
        <span class="swatch-info">${formatColor(hex)}</span>
        <button class="lock-btn ${locks[i] ? 'locked' : ''}" data-lock="${i}" aria-label="Lock colour">${locks[i] ? '🔒' : '🔓'}</button>
      </div>`;
    paletteEl.appendChild(swatch);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1600);
}

function copy(text, message) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast(message));
  } else {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    showToast(message);
  }
}

function renderSaved() {
  savedList.innerHTML = '';
  savedEmpty.hidden = saved.length !== 0;

  saved.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'saved-item';

    const colorsRow = document.createElement('div');
    colorsRow.className = 'saved-colors';
    item.forEach((hex) => {
      const span = document.createElement('span');
      span.style.background = hex;
      span.title = hex;
      span.addEventListener('click', () => copy(hex, `Copied ${hex}`));
      colorsRow.appendChild(span);
    });

    const actions = document.createElement('div');
    actions.className = 'saved-actions';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'icon-btn';
    loadBtn.textContent = 'Load';
    loadBtn.addEventListener('click', () => {
      colors = item.slice();
      locks = item.map(() => false);
      renderPalette();
      showToast('Palette loaded');
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn del';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      saved.splice(index, 1);
      localStorage.setItem(STORE_KEY, JSON.stringify(saved));
      renderSaved();
      showToast('Palette deleted');
    });

    actions.append(loadBtn, delBtn);
    row.append(colorsRow, actions);
    savedList.appendChild(row);
  });
}

paletteEl.addEventListener('click', (e) => {
  const lockBtn = e.target.closest('[data-lock]');
  if (lockBtn) {
    const i = Number(lockBtn.dataset.lock);
    locks[i] = !locks[i];
    renderPalette();
    return;
  }

  const copyArea = e.target.closest('[data-copy]');
  if (copyArea) {
    const hex = copyArea.dataset.copy;
    copy(hex, `Copied ${hex}`);
  }
});

generateBtn.addEventListener('click', generatePalette);

document.querySelectorAll('.fmt').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.fmt').forEach((b) => b.classList.toggle('is-active', b === btn));
    format = btn.dataset.format;
    renderPalette();
  });
});

saveBtn.addEventListener('click', () => {
  saved.unshift(colors.slice());
  if (saved.length > 12) saved.pop();
  localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  renderSaved();
  showToast('Palette saved');
});

copyAllBtn.addEventListener('click', () => {
  copy(colors.map(formatColor).join(', '), 'All colours copied');
});

clearSaved.addEventListener('click', () => {
  if (saved.length === 0) return;
  saved = [];
  localStorage.setItem(STORE_KEY, JSON.stringify(saved));
  renderSaved();
  showToast('Saved palettes cleared');
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
    generatePalette();
  }
});

generatePalette();
renderSaved();
