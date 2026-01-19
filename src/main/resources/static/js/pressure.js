// ===== グローバル =====
let pressureChart = null;
const STORAGE_CURRENT = 'pressure_current';
const STORAGE_WEEKLY = 'pressure_weekly';
const STORAGE_SETTINGS = 'pressure_settings';

// ===== 設定（デフォルト）=====
const defaultSettings = {
  warning: -3,
  danger: -6,
  refreshMin: 30
};

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
  // 初回
  loadPressure();
  loadWeeklyPressure();
  startAutoRefresh();

  // 地域変更
  document.getElementById('citySelect').addEventListener('change', () => {
    loadPressure();
    loadWeeklyPressure();
  });

  // 設定保存
  const saveBtn = document.getElementById('saveSettings');
  if (saveBtn) saveBtn.addEventListener('click', applySettingsFromUI);
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('SW registered'));
  }

});

//JSから通知を出す
function notifyDangerPWA(message) {
  if (!('serviceWorker' in navigator)) return;

  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('PressureCare 警戒', {
          body: message,
          icon: '/machine_kiatsukei.png'
        });
      });
    }
  });
}
notifyDangerPWA('気圧変化が大きいため、体調に注意してください');

//レイアウト表示の際の制御用
document.getElementById('statusCard')
        .classList.add('skeleton');

document.getElementById('statusCard')
		.classList.remove('skeleton');

function loadSettings() {
  const s = localStorage.getItem(STORAGE_SETTINGS);
  return s ? JSON.parse(s) : { ...defaultSettings };
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(s));
}

// ===== localStorage =====
function saveLS(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function loadLS(key) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : null;
}

// ===== ローディング =====
function showLoading() {
  document.getElementById('loadingOverlay')
          .classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay')
          .classList.add('hidden');
}

// ===== 判定（フロント側・予測用）=====
function judge(diff, settings) {
  if (diff <= settings.danger) return 'DANGER';
  if (diff <= settings.warning) return 'WARNING';
  return 'SAFE';
}

// ===== 通知 =====
function notifyIfNeeded(level, title, body) {
  if (level !== 'DANGER') return;
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

// ===== 描画（現在・昨日）=====
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderPressure(data) {
  setText('current', Number(data.currentPressure).toFixed(1));
  setText('yesterday', Number(data.yesterdayPressure).toFixed(1));
  setText('difference', Number(data.difference).toFixed(1));

  const conditionEl = document.getElementById('condition');
  const warningEl = document.getElementById('warningMessage');
  if (!conditionEl || !warningEl) return;

  conditionEl.textContent = data.conditionLevel;
  conditionEl.className = '';
  warningEl.classList.add('hidden');

  switch (data.conditionLevel) {
    case 'DANGER':
      conditionEl.classList.add('danger-level');
      warningEl.textContent = '体調管理に十分注意してください';
      warningEl.classList.remove('hidden');
      break;
    case 'WARNING':
      conditionEl.classList.add('warning-level');
      warningEl.textContent = '無理は控えめにしましょう';
      warningEl.classList.remove('hidden');
      break;
    default:
      conditionEl.classList.add('safe');
  }
}

// ===== 現在・昨日 取得（フォールバック付き）=====
function loadPressure() {
  const city = document.getElementById('citySelect').value;
  showLoading();

  fetch(`/pressure/data?city=${city}`)
    .then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then(data => {
      renderPressure(data);
    })
    .catch(() => {
      const cached = loadLS(STORAGE_CURRENT);
      if (cached) renderPressure(cached);
    })
    .finally(hideLoading);
}

// ===== 週間グラフ =====
function renderWeekly(data) {
  const labels = data.map(d => d.date);
  const values = data.map(d => Number(d.pressure).toFixed(1));

  if (pressureChart) pressureChart.destroy();

  const ctx = document.getElementById('pressureChart').getContext('2d');
  pressureChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '平均気圧 (hPa)',
        data: values,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });
}

function loadWeeklyPressure() {
  const city = document.getElementById('citySelect').value;

  fetch(`/pressure/weekly?city=${city}`)
    .then(r => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then(data => {
      renderWeekly(data);
    })
    .finally(hideLoading);
}

// ===== 明日の注意予測（フロント計算）=====
function renderTomorrowPrediction(weekly) {
  const settings = loadSettings();
  if (!weekly || weekly.length < 2) return;

  const today = weekly[weekly.length - 1].pressure;
  const yesterday = weekly[weekly.length - 2].pressure;
  const diff = today - yesterday;

  const level = judge(diff, settings);
  const el = document.getElementById('tomorrowMsg');

  if (!el) return;

  if (level === 'DANGER') {
    el.textContent = '⚠ 明日は体調に十分注意が必要です';
    el.classList.remove('hidden');
    notifyIfNeeded('DANGER', '明日の注意', '明日は体調に十分注意してください');
  } else if (level === 'WARNING') {
    el.textContent = '⚠ 明日は無理をしない方が良さそうです';
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// ===== 設定UI =====
function applySettingsFromUI() {
  const s = {
    warning: Number(document.getElementById('settingWarning').value),
    danger: Number(document.getElementById('settingDanger').value),
    refreshMin: Number(document.getElementById('settingRefresh').value)
  };
  saveSettings(s);
  restartAutoRefresh();
  alert('設定を保存しました');
}

let refreshTimer = null;
function startAutoRefresh() {
  const s = loadSettings();
  refreshTimer = setInterval(() => {
    loadPressure();
    loadWeeklyPressure();
  }, s.refreshMin * 60 * 1000);
}
function restartAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  startAutoRefresh();
}

// ===== 設定モーダル制御 =====
const modal = document.getElementById('settingsModal');
const openBtn = document.getElementById('openSettings');
const closeBtn = document.getElementById('closeSettings');

if (openBtn && modal) {
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });
}

if (closeBtn && modal) {
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
}

// 背景クリックで閉じる（UX◎）
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
}

