/**
 * API Integration Module
 * Handles communication with HeyGen, Kling, and ElevenLabs APIs
 */

const ApiService = {
  /**
   * Get stored API config
   */
  getConfig() {
    return {
      heygen: {
        key: localStorage.getItem('api_heygen_key') || '',
        avatar: localStorage.getItem('api_heygen_avatar') || ''
      },
      kling: {
        key: localStorage.getItem('api_kling_key') || ''
      },
      elevenlabs: {
        key: localStorage.getItem('api_elevenlabs_key') || '',
        voice: localStorage.getItem('api_elevenlabs_voice') || ''
      },
      llm: {
        key: localStorage.getItem('api_llm_key') || '',
        provider: localStorage.getItem('api_llm_provider') || 'claude'
      }
    };
  },

  /**
   * Check which APIs are configured
   */
  getStatus() {
    const cfg = this.getConfig();
    return {
      heygen: !!cfg.heygen.key,
      kling: !!cfg.kling.key,
      elevenlabs: !!cfg.elevenlabs.key,
      llm: !!cfg.llm.key
    };
  },

  // ==================== HEYGEN ====================

  /**
   * Send script to HeyGen to generate avatar video
   */
  async sendToHeyGen(text) {
    const cfg = this.getConfig().heygen;
    if (!cfg.key) throw new Error('Clé API HeyGen manquante. Va dans Réglages.');
    if (!cfg.avatar) throw new Error('Avatar ID manquant. Va dans Réglages.');

    const res = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': cfg.key
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: cfg.avatar,
            avatar_style: 'normal'
          },
          voice: {
            type: 'text',
            input_text: text,
            voice_id: '' // Will use avatar's default voice
          },
          background: {
            type: 'color',
            value: '#1a1a2e'
          }
        }],
        dimension: {
          width: 1080,
          height: 1920
        },
        aspect_ratio: '9:16'
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Erreur HeyGen');
    return { videoId: data.data?.video_id, status: 'processing' };
  },

  /**
   * Check HeyGen video status
   */
  async checkHeyGenStatus(videoId) {
    const cfg = this.getConfig().heygen;
    const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: { 'X-Api-Key': cfg.key }
    });
    const data = await res.json();
    return {
      status: data.data?.status,
      url: data.data?.video_url,
      thumbnail: data.data?.thumbnail_url
    };
  },

  // ==================== KLING ====================

  /**
   * Send prompt to Kling to generate video clip
   */
  async sendToKling(prompt) {
    const cfg = this.getConfig().kling;
    if (!cfg.key) throw new Error('Clé API Kling manquante. Va dans Réglages.');

    const res = await fetch('https://api.klingai.com/v1/videos/text2video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.key}`
      },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: 'blurry, low quality, distorted, watermark',
        cfg_scale: 0.5,
        mode: 'std',
        aspect_ratio: '9:16',
        duration: '5'
      })
    });

    const data = await res.json();
    if (data.code !== 0 && data.code !== undefined) throw new Error(data.message || 'Erreur Kling');
    return { taskId: data.data?.task_id, status: 'processing' };
  },

  /**
   * Check Kling task status
   */
  async checkKlingStatus(taskId) {
    const cfg = this.getConfig().kling;
    const res = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
      headers: { 'Authorization': `Bearer ${cfg.key}` }
    });
    const data = await res.json();
    return {
      status: data.data?.task_status,
      url: data.data?.task_result?.videos?.[0]?.url
    };
  },

  // ==================== ELEVENLABS ====================

  /**
   * Send text to ElevenLabs for voice generation
   */
  async sendToElevenLabs(text) {
    const cfg = this.getConfig().elevenlabs;
    if (!cfg.key) throw new Error('Clé API ElevenLabs manquante. Va dans Réglages.');
    if (!cfg.voice) throw new Error('Voice ID manquant. Va dans Réglages.');

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voice}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': cfg.key
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || 'Erreur ElevenLabs');
    }

    // Returns audio blob
    const blob = await res.blob();
    return { audioUrl: URL.createObjectURL(blob), status: 'done' };
  },

  // ==================== UTILS ====================

  /**
   * Extract spoken text from script (removes stage directions)
   */
  extractSpokenText(script) {
    return script
      .replace(/\[.*?\]/g, '')
      .replace(/---[\s\S]*/g, '')
      .split('\n')
      .filter(l => l.trim())
      .join(' ')
      .trim();
  }
};
