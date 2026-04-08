/**
 * DigAssist Video Studio - Main App Controller
 */

const App = {
  currentPage: 'home',

  init() {
    // Splash screen
    setTimeout(() => {
      document.getElementById('splash').classList.add('fade-out');
      document.getElementById('app').classList.remove('hidden');
    }, 1500);

    this.bindNavigation();
    this.bindCreateForm();
    this.bindSettings();
    this.bindCopyButtons();
    this.bindSendButtons();
    this.loadSettings();
    this.registerSW();
  },

  // ==================== NAVIGATION ====================

  bindNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        this.navigateTo(page);
      });
    });

    document.getElementById('btn-settings').addEventListener('click', () => {
      this.navigateTo('settings');
    });
  },

  navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    // Show target page
    document.getElementById(`page-${page}`).classList.add('active');
    const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Update header title
    const titles = { home: 'Video Studio', history: 'Historique', settings: 'Réglages' };
    document.getElementById('page-title').textContent = titles[page] || 'Video Studio';

    this.currentPage = page;
  },

  // ==================== CREATE VIDEO ====================

  bindCreateForm() {
    const form = document.getElementById('form-create');
    const btnGenerate = document.getElementById('btn-generate');
    const btnGenPrompts = document.getElementById('btn-gen-prompts');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const topic = document.getElementById('input-topic').value.trim();
      if (!topic) {
        this.toast('Entre un sujet !');
        return;
      }

      const style = document.getElementById('select-style').value;
      const duration = parseInt(document.getElementById('select-duration').value);
      const tone = document.getElementById('select-tone').value;

      // Show loading
      btnGenerate.disabled = true;
      btnGenerate.innerHTML = '<span class="spinner"></span>Génération...';

      try {
        const script = await ScriptGenerator.generateScript(topic, style, duration, tone);

        // Show result
        document.getElementById('script-output').textContent = script;
        document.getElementById('result-script').classList.remove('hidden');
        document.getElementById('result-prompts').classList.add('hidden');

        // Store for later use
        this._currentScript = script;
        this._currentTopic = topic;
        this._currentStyle = style;

        // Save to history
        this.addToHistory(topic, style, script);

        // Scroll to result
        document.getElementById('result-script').scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        this.toast('Erreur : ' + err.message);
      } finally {
        btnGenerate.disabled = false;
        btnGenerate.textContent = 'Générer le script';
      }
    });

    btnGenPrompts.addEventListener('click', () => {
      if (!this._currentScript) return;

      const prompts = ScriptGenerator.generatePrompts(
        this._currentScript,
        this._currentTopic,
        this._currentStyle
      );

      document.getElementById('prompt-heygen').textContent = prompts.heygen;
      document.getElementById('prompt-kling').textContent = prompts.kling;
      document.getElementById('prompt-elevenlabs').textContent = prompts.elevenlabs;
      document.getElementById('result-prompts').classList.remove('hidden');

      document.getElementById('result-prompts').scrollIntoView({ behavior: 'smooth' });
    });
  },

  // ==================== COPY BUTTONS ====================

  bindCopyButtons() {
    // Main script copy
    document.getElementById('btn-copy-script').addEventListener('click', () => {
      const text = document.getElementById('script-output').textContent;
      this.copyToClipboard(text);
    });

    // Prompt copy buttons
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        const text = document.getElementById(target).textContent;
        this.copyToClipboard(text);
      });
    });
  },

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.toast('Copié !');
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.toast('Copié !');
    });
  },

  // ==================== SEND TO API ====================

  bindSendButtons() {
    document.querySelectorAll('.btn-send').forEach(btn => {
      btn.addEventListener('click', async () => {
        const api = btn.dataset.api;
        const status = ApiService.getStatus();

        if (!status[api]) {
          this.toast(`Configure ta clé ${api.toUpperCase()} dans Réglages`);
          return;
        }

        btn.disabled = true;
        const originalText = btn.textContent;
        btn.innerHTML = '<span class="spinner"></span>Envoi...';

        try {
          let result;
          const spokenText = ApiService.extractSpokenText(this._currentScript);

          switch (api) {
            case 'heygen':
              result = await ApiService.sendToHeyGen(spokenText);
              this.showStatus('HeyGen', 'loading', `Vidéo en cours... ID: ${result.videoId}`);
              this.toast('Envoyé à HeyGen !');
              break;

            case 'kling':
              const klingPrompt = document.getElementById('prompt-kling').textContent;
              // Extract first prompt
              const firstPrompt = klingPrompt.match(/"([^"]+)"/)?.[1] || klingPrompt;
              result = await ApiService.sendToKling(firstPrompt);
              this.showStatus('Kling', 'loading', `Vidéo en cours... ID: ${result.taskId}`);
              this.toast('Envoyé à Kling !');
              break;

            case 'elevenlabs':
              result = await ApiService.sendToElevenLabs(spokenText);
              this.showStatus('ElevenLabs', 'success', 'Audio généré !');
              // Auto-play audio
              const audio = new Audio(result.audioUrl);
              audio.play().catch(() => {});
              this.toast('Audio généré !');
              break;
          }
        } catch (err) {
          this.showStatus(api, 'error', err.message);
          this.toast('Erreur : ' + err.message);
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });
    });
  },

  showStatus(name, state, message) {
    const container = document.getElementById('api-status');
    const list = document.getElementById('status-list');
    container.classList.remove('hidden');

    const item = document.createElement('div');
    item.className = 'status-item';
    item.innerHTML = `<span class="status-dot ${state}"></span><span>${name}: ${message}</span>`;
    list.prepend(item);
  },

  // ==================== SETTINGS ====================

  bindSettings() {
    document.getElementById('form-settings').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSettings();
    });
  },

  loadSettings() {
    const fields = {
      'api-llm-provider': 'api_llm_provider',
      'api-llm-key': 'api_llm_key',
      'api-heygen-key': 'api_heygen_key',
      'api-heygen-avatar': 'api_heygen_avatar',
      'api-kling-key': 'api_kling_key',
      'api-elevenlabs-key': 'api_elevenlabs_key',
      'api-elevenlabs-voice': 'api_elevenlabs_voice'
    };

    Object.entries(fields).forEach(([id, key]) => {
      const val = localStorage.getItem(key);
      if (val) document.getElementById(id).value = val;
    });
  },

  saveSettings() {
    const fields = {
      'api-llm-provider': 'api_llm_provider',
      'api-llm-key': 'api_llm_key',
      'api-heygen-key': 'api_heygen_key',
      'api-heygen-avatar': 'api_heygen_avatar',
      'api-kling-key': 'api_kling_key',
      'api-elevenlabs-key': 'api_elevenlabs_key',
      'api-elevenlabs-voice': 'api_elevenlabs_voice'
    };

    Object.entries(fields).forEach(([id, key]) => {
      const val = document.getElementById(id).value.trim();
      if (val) {
        localStorage.setItem(key, val);
      } else {
        localStorage.removeItem(key);
      }
    });

    const status = document.getElementById('settings-status');
    status.textContent = 'Paramètres sauvegardés !';
    status.className = 'status-msg success';
    setTimeout(() => status.classList.add('hidden'), 3000);

    this.toast('Sauvegardé !');
  },

  // ==================== HISTORY ====================

  addToHistory(topic, style, script) {
    const history = JSON.parse(localStorage.getItem('video_history') || '[]');
    history.unshift({
      id: Date.now(),
      topic,
      style,
      script,
      date: new Date().toLocaleDateString('fr-FR')
    });
    // Keep last 50
    if (history.length > 50) history.pop();
    localStorage.setItem('video_history', JSON.stringify(history));
    this.renderHistory();
  },

  renderHistory() {
    const history = JSON.parse(localStorage.getItem('video_history') || '[]');
    const container = document.getElementById('history-list');

    if (history.length === 0) {
      container.innerHTML = '<p class="empty-state">Aucune vidéo créée pour l\'instant.</p>';
      return;
    }

    const styles = { ugc: 'UGC', info: 'Infopreneure', hook: 'Hook viral', storytelling: 'Storytelling' };

    container.innerHTML = history.map(item => `
      <div class="history-item" data-id="${item.id}">
        <h4>${item.topic}</h4>
        <p class="meta">${styles[item.style] || item.style} · ${item.date}</p>
      </div>
    `).join('');

    // Click to reload script
    container.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = history.find(h => h.id === parseInt(el.dataset.id));
        if (item) {
          document.getElementById('input-topic').value = item.topic;
          document.getElementById('script-output').textContent = item.script;
          document.getElementById('result-script').classList.remove('hidden');
          this._currentScript = item.script;
          this._currentTopic = item.topic;
          this._currentStyle = item.style;
          this.navigateTo('home');
          this.toast('Script rechargé');
        }
      });
    });
  },

  // ==================== TOAST ====================

  toast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }, 2500);
  },

  // ==================== SERVICE WORKER ====================

  registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
};

// ==================== BOOT ====================
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.renderHistory();
});
