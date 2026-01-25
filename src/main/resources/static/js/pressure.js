// ================================
// PressureCare App
// this設計（クラス管理）
// Promiseは then / catch 維持
// ================================
class PressureApp {

  // ===== デフォルト設定 =====
  // ※ localStorage に設定がない場合に使用
  defaultSettings = {
    warning: -3,     // 注意判定の閾値
    danger: -6,      // 警戒判定の閾値
    refreshMin: 1   // 自動更新間隔（分）
  };

  constructor() {
    // ===== localStorageキー =====
    this.STORAGE_CURRENT  = 'pressure_current';   // 現在気圧
    this.STORAGE_WEEKLY   = 'pressure_weekly';    // 週間気圧
    this.STORAGE_SETTINGS = 'pressure_settings';  // ユーザー設定

    // ===== 状態管理 =====
    this.pressureChart = null; // Chart.jsインスタンス
    this.refreshTimer  = null; // 自動更新タイマー

    // ===== DOM参照 =====
    this.citySelect     = document.getElementById('citySelect');
    this.statusCard     = document.getElementById('statusCard');
    this.loadingOverlay = document.getElementById('loadingOverlay');
    this.modal          = document.getElementById('settingsModal');

    // ===== thisバインド =====
    // イベントから呼ばれてもthisがズレないようにする
    this.loadPressure         = this.loadPressure.bind(this);
    this.loadWeeklyPressure   = this.loadWeeklyPressure.bind(this);
    this.applySettingsFromUI  = this.applySettingsFromUI.bind(this);
	this.defaultCity = this.citySelect?.dataset.defaultCity;
  }

  // ================================
  // 初期化処理
  // ================================
  init() {
	// Thymeleafで渡された初期都市を反映
	if (this.defaultCity && this.citySelect) {
	   this.citySelect.value = this.defaultCity;
	 }    // 初期データ取得
    this.loadPressure();
    this.loadWeeklyPressure();
    this.startAutoRefresh();
    // ===== 都市変更イベント =====
    if (this.citySelect) {
      this.citySelect.addEventListener('change', () => {
        this.loadPressure();
        this.loadWeeklyPressure();
      });
    }

    // ===== 設定保存 =====
    const saveBtn = document.getElementById('saveSettings');
    if (saveBtn) {
      saveBtn.addEventListener('click', this.applySettingsFromUI);
    }

    // ===== 設定モーダル制御 =====
    const openBtn  = document.getElementById('openSettings');
    const closeBtn = document.getElementById('closeSettings');

    if (openBtn && this.modal) {
      openBtn.addEventListener('click', () => {
        this.modal.classList.remove('hidden');
      });
    }

    if (closeBtn && this.modal) {
      closeBtn.addEventListener('click', () => {
        this.modal.classList.add('hidden');
      });
    }

    // 背景クリックで閉じる
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.modal.classList.add('hidden');
        }
      });
    }

    // ===== Service Worker登録（PWA用）=====
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('ServiceWorker registered'));
    }
  }

  // ================================
  // localStorage操作
  // ================================
  saveLS(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  loadLS(key) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  }

  // ================================
  // 設定管理
  // ================================
  loadSettings() {
    const s = localStorage.getItem(this.STORAGE_SETTINGS);
    return s ? JSON.parse(s) : { ...this.defaultSettings };
  }

  saveSettings(s) {
    localStorage.setItem(this.STORAGE_SETTINGS, JSON.stringify(s));
  }

  // ================================
  // ローディング表示
  // ================================
  showLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('hidden');
    }
  }

  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('hidden');
    }
  }

  // ================================
  // 気圧差による判定
  // ================================
  judge(diff, settings) {
    if (diff <= settings.danger)  return 'DANGER';
    if (diff <= settings.warning) return 'WARNING';
    return 'SAFE';
  }

  // ================================
  // 通知処理（ブラウザ通知）
  // ================================
  notifyIfNeeded(level, title, body) {
    if (level !== 'DANGER') return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  // ================================
  // PWA通知（ServiceWorker経由）
  // ================================
  notifyDangerPWA(message) {
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

  // ================================
  // 表示系ユーティリティ
  // ================================
  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // 現在・前日データ表示
  renderPressure(data) {
    this.setText('current',    Number(data.currentPressure).toFixed(1));
    this.setText('yesterday',  Number(data.yesterdayPressure).toFixed(1));
    this.setText('difference', Number(data.difference).toFixed(1));

    const conditionEl = document.getElementById('condition');
    const warningEl   = document.getElementById('warningMessage');
    if (!conditionEl || !warningEl) return;

    // 表示用（label）
    const labelMap = {
      SAFE: '安全',
      WARNING: '注意',
      DANGER: '警戒'
    };

    conditionEl.textContent = labelMap[data.conditionLevel] ?? data.conditionLevel;

    // クラスは enum 名
    conditionEl.className = 'badge';
    conditionEl.classList.add(data.conditionLevel);

    warningEl.classList.add('hidden');

    switch (data.conditionLevel) {
      case 'DANGER':
        warningEl.textContent = '体調管理に十分注意してください';
        warningEl.classList.remove('hidden');
        break;
      case 'WARNING':
        warningEl.textContent = '無理は控えめにしましょう';
        warningEl.classList.remove('hidden');
        break;
    }
  }
  // ================================
  // 現在・前日気圧取得
  // ================================
  loadPressure() {
    // select から都市コードを取得（未選択なら処理しない）
    const city = this.citySelect?.value;
    if (!city) return;

    // ローディング表示（非同期開始）
    this.showLoading();

    // fetch は Promise を返す（ここから Promiseチェーン開始）
    fetch(`/pressure/data?city=${encodeURIComponent(city)}`)

      // ===== A =====
      // HTTPレスポンスの成否判定
      // res.ok === false の場合は throw
      // throw された時点で catch にジャンプ
      .then(this.handleResponse)

      // ===== B =====
      // Response → JSON に変換
      // res.json() も Promise を返す
      // resolve されたデータが次の then に渡る
      .then(this.parseJson)

      // ===== C =====
      // 成功時の最終処理
      // 画面描画
      // localStorage保存
      // return data で次の then に値を渡せる
      .then(data => this.onSuccess(data))

      // ===== ERROR =====
      // 上記のどこかで throw / reject されたらここに来る
      // 通信エラー
      // HTTPエラー
      // JSON変換エラーなど
      .catch(err => this.onError(err))

      // ===== FINALLY =====
      // 成功・失敗に関係なく必ず実行される
      // ローディング解除など後処理に使う
      .finally(() => this.hideLoading());
  }

  // ================================
  // 週間気圧取得
  // ================================
  loadWeeklyPressure() {
    // 都市未選択なら何もしない
    const city = this.citySelect?.value;
    if (!city) return;

    // 週間データ取得（Promise開始）
    fetch(`/pressure/weekly?city=${encodeURIComponent(city)}`)

      // ===== A =====
      // HTTPレスポンスチェック
      .then(this.handleResponse)

      // ===== B =====
      // JSONへ変換（Promise）
      .then(this.parseJson)

      // ===== C =====
      // 正常時処理をまとめて実行
      .then(data => {
        // グラフ描画
        this.renderWeekly(data);

        // 明日の体調予測
        this.renderTomorrowPrediction(data);

        // localStorage に保存
        this.saveLS(this.STORAGE_WEEKLY, data);

        // return することで Promiseチェーンを継続可能
        return data;
      })

      // ===== ERROR =====
      // エラー時はキャッシュから復元
      .catch(err => {
        console.error(err);
        const cached = this.loadLS(this.STORAGE_WEEKLY);
        if (cached) {
          this.renderWeekly(cached);
        }
      });
  }

  // ================================
  // Promiseチェーン用 共通処理
  // ================================

  // HTTPステータスチェック用
  handleResponse(res) {
    // fetch は 404/500 でも reject しない
    // そのため自分で throw する必要がある
    if (!res.ok) {
      throw new Error('pressure api error');
    }
    // 正常時は Response を次の then に渡す
    return res;
  }

  // Response → JSON 変換
  parseJson(res) {
    // res.json() は Promise を返す
    // resolve された結果が次の then に渡る
    return res.json();
  }

  // 成功時の共通処理
  onSuccess(data) {
    // 画面反映
    this.renderPressure(data);

    // localStorage 保存
    this.saveLS(this.STORAGE_CURRENT, data);

    // 次の then に値を渡したい場合は return
    return data;
  }

  // エラー時の共通処理
  onError(err) {
    console.error(err);

    // 通信失敗時はキャッシュ表示
    const cached = this.loadLS(this.STORAGE_CURRENT);
    if (cached) {
      this.renderPressure(cached);
    }
  }

  // ================================
  // グラフ描画
  // ================================
  renderWeekly(data) {
    const labels = data.map(d => d.date);
    const values = data.map(d => Number(d.pressure).toFixed(1));

    if (this.pressureChart) this.pressureChart.destroy();

    const ctx = document.getElementById('pressureChart')?.getContext('2d');
    if (!ctx) return;

    this.pressureChart = new Chart(ctx, {
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

  // ================================
  // 明日の体調予測
  // ================================
  renderTomorrowPrediction(weekly) {
    const settings = this.loadSettings();
    if (!weekly || weekly.length < 2) return;

    const today     = weekly[weekly.length - 1].pressure;
    const yesterday = weekly[weekly.length - 2].pressure;
    const diff      = today - yesterday;

    const level = this.judge(diff, settings);
    const el    = document.getElementById('tomorrowMsg');
    if (!el) return;

    if (level === 'DANGER') {
      el.textContent = '⚠ 明日は体調に十分注意が必要です';
      el.classList.remove('hidden');
      this.notifyIfNeeded('DANGER', '明日の注意', '明日は体調に十分注意してください');
    } else if (level === 'WARNING') {
      el.textContent = '⚠ 明日は無理をしない方が良さそうです';
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  // ================================
  // 設定画面
  // ================================
  applySettingsFromUI() {
    const s = {
      warning:    Number(document.getElementById('settingWarning').value),
      danger:     Number(document.getElementById('settingDanger').value),
      refreshMin: Number(document.getElementById('settingRefresh').value)
    };
    this.saveSettings(s);
    this.restartAutoRefresh();
    alert('設定を保存しました');
  }

  // ================================
  // 自動更新制御
  // ================================
  startAutoRefresh() {
    const s = this.loadSettings();
    this.refreshTimer = setInterval(() => {
      this.loadPressure();
      this.loadWeeklyPressure();
    }, s.refreshMin * 60 * 1000);
  }

  restartAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.startAutoRefresh();
  }
}

// ================================
// 起動処理
// ================================
document.addEventListener('DOMContentLoaded', () => {
  const app = new PressureApp();
  app.init();

  // 初回通知テスト（不要なら削除）
  app.notifyDangerPWA('気圧変化が大きいため、体調に注意してください');
});
