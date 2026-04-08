/**
 * Script & Prompt Generator
 * Generates video scripts and platform-specific prompts
 */

const ScriptGenerator = {
  /**
   * Generate a video script based on topic, style, duration and tone
   * Uses LLM API if key is available, otherwise uses local templates
   */
  async generateScript(topic, style, duration, tone) {
    const apiKey = localStorage.getItem('api_llm_key');
    const provider = localStorage.getItem('api_llm_provider') || 'claude';

    if (apiKey) {
      return this._generateWithLLM(topic, style, duration, tone, apiKey, provider);
    }
    return this._generateLocal(topic, style, duration, tone);
  },

  /**
   * Generate script via LLM API (Claude or OpenAI)
   */
  async _generateWithLLM(topic, style, duration, tone, apiKey, provider) {
    const prompt = this._buildSystemPrompt(style, duration, tone);
    const userMsg = `Crée un script vidéo sur le sujet suivant : "${topic}"`;

    if (provider === 'claude') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: prompt,
          messages: [{ role: 'user', content: userMsg }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.content[0].text;
    }

    // OpenAI
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: userMsg }
        ],
        max_tokens: 1024
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
  },

  /**
   * Build system prompt for LLM based on parameters
   */
  _buildSystemPrompt(style, duration, tone) {
    const styles = {
      ugc: 'Style UGC face caméra. Le personnage parle directement à la caméra comme un vrai créateur. Naturel, authentique, pas scripté.',
      info: 'Style infopreneure éducatif. Contenu de valeur, structuré avec des points clés numérotés. Crédible et expert.',
      hook: 'Style hook viral. Accroche ultra percutante dans les 3 premières secondes. Court, punchy, irrésistible.',
      storytelling: 'Style storytelling. Raconte une histoire captivante avec une tension narrative. Début accrocheur, milieu intrigant, fin impactante.'
    };

    const tones = {
      pro: 'Ton professionnel et crédible.',
      casual: 'Ton casual et friendly, comme si tu parlais à un pote.',
      energetic: 'Ton très énergique et motivant, beaucoup de dynamisme.',
      luxury: 'Ton premium et luxe, vocabulaire soigné et élégant.'
    };

    const wordCount = Math.round(duration * 2.5); // ~150 mots/min speaking rate

    return `Tu es un expert en création de scripts vidéo pour les réseaux sociaux (Instagram Reels, TikTok).

${styles[style]}
${tones[tone]}

Règles :
- Le script doit durer environ ${duration} secondes (~${wordCount} mots)
- Commence TOUJOURS par un hook accrocheur dans les 3 premières secondes
- Finis par un CTA (call to action) clair
- Écris en français, langage parlé naturel (pas littéraire)
- Utilise des phrases courtes et percutantes
- Indique les pauses et emphases entre [crochets]
- Structure : HOOK → CONTENU → CTA

Format de sortie :
[HOOK - 3 sec]
...
[CONTENU]
...
[CTA]
...`;
  },

  /**
   * Fallback: local template-based script generation (no API needed)
   */
  _generateLocal(topic, style, duration, tone) {
    const hooks = {
      ugc: [
        `Arrête de scroller, j'ai un truc important à te dire sur ${topic}...`,
        `Tu fais encore cette erreur avec ${topic} ? Laisse-moi t'expliquer...`,
        `Ce que personne ne te dit sur ${topic}...`
      ],
      info: [
        `Voici les ${Math.floor(Math.random() * 3) + 3} choses que tu dois savoir sur ${topic}.`,
        `${topic} : la vérité que 99% des gens ignorent.`,
        `Masterclass express : ${topic} en ${duration} secondes.`
      ],
      hook: [
        `STOP. ${topic}. Tu fais tout faux.`,
        `J'ai découvert un truc de dingue sur ${topic}.`,
        `${topic} ? Oublie tout ce qu'on t'a dit.`
      ],
      storytelling: [
        `Il y a 6 mois, je ne connaissais rien à ${topic}. Aujourd'hui...`,
        `Tout a changé quand j'ai compris ça sur ${topic}...`,
        `L'histoire que je vais te raconter sur ${topic} va te choquer.`
      ]
    };

    const ctas = [
      'Follow pour plus de contenu comme ça.',
      'Like et partage si ça t\'a aidé.',
      'Commente "GO" et je t\'envoie le guide complet.',
      'Abonne-toi, je poste tous les jours.',
      'Enregistre ce post, tu vas en avoir besoin.'
    ];

    const hook = hooks[style][Math.floor(Math.random() * hooks[style].length)];
    const cta = ctas[Math.floor(Math.random() * ctas.length)];

    return `[HOOK - 3 sec]
${hook}

[CONTENU - ${duration - 6} sec]
Alors voici ce que tu dois comprendre sur ${topic}.

Point 1 : [Développe le premier aspect clé]
[Pause]

Point 2 : [Développe le deuxième aspect]
[Emphase sur le point important]

Point 3 : [Développe le troisième aspect]

[CTA - 3 sec]
${cta}

---
⚠️ Script généré en mode local (sans IA).
Pour un script personnalisé et plus naturel, ajoute ta clé API Claude ou OpenAI dans les Réglages.`;
  },

  /**
   * Generate platform-specific prompts from a script
   */
  generatePrompts(script, topic, style) {
    return {
      heygen: this._generateHeyGenPrompt(script, style),
      kling: this._generateKlingPrompt(topic, style),
      elevenlabs: this._generateElevenLabsPrompt(script)
    };
  },

  _generateHeyGenPrompt(script, style) {
    // Extract just the spoken text (remove stage directions)
    const spokenText = script
      .replace(/\[.*?\]/g, '')
      .replace(/---[\s\S]*/g, '')
      .split('\n')
      .filter(l => l.trim())
      .join('\n');

    const backgrounds = {
      ugc: 'Fond neutre flou (appartement moderne, bureau épuré ou mur texturé)',
      info: 'Fond professionnel (bureau, bibliothèque, ou fond uni sombre)',
      hook: 'Fond dynamique coloré ou gradient vibrant',
      storytelling: 'Fond atmosphérique et cinématique (lumière chaude, légèrement flou)'
    };

    return `=== HEYGEN - Avatar Vidéo ===

📝 TEXTE À DIRE :
${spokenText}

🎭 PARAMÈTRES AVATAR :
- Expression : naturelle, engageante
- Regard : droit vers la caméra
- Gestuelles : activées (mouvements naturels des mains)
- ${backgrounds[style]}

📐 FORMAT :
- Ratio : 9:16 (vertical, Reels/TikTok)
- Résolution : 1080x1920
- Cadrage : buste (mi-poitrine)`;
  },

  _generateKlingPrompt(topic, style) {
    const moods = {
      ugc: 'authentic, natural lighting, casual vibe, social media aesthetic',
      info: 'professional, clean, modern, educational, corporate light',
      hook: 'dramatic, high contrast, vibrant colors, eye-catching, dynamic',
      storytelling: 'cinematic, warm tones, atmospheric, emotional, film grain'
    };

    return `=== KLING - Plans de coupe / B-roll ===

🎥 PLAN 1 (Intro - 2sec) :
"${topic}, ${moods[style]}, close-up shot, shallow depth of field, 4K, smooth motion"

🎥 PLAN 2 (Transition - 2sec) :
"Abstract visual related to ${topic}, ${moods[style]}, slow motion, bokeh, elegant transition"

🎥 PLAN 3 (Illustration - 3sec) :
"Person interacting with ${topic} concept, ${moods[style]}, medium shot, natural movement, lifestyle"

🎥 PLAN 4 (Outro - 2sec) :
"Inspiring wide shot, ${moods[style]}, golden hour lighting, motivational, pull-back reveal"

⚙️ PARAMÈTRES :
- Mode : Haute qualité
- Ratio : 9:16
- Durée par clip : 2-3 secondes
- Style : Réaliste / Cinématique`;
  },

  _generateElevenLabsPrompt(script) {
    const spokenText = script
      .replace(/\[.*?\]/g, '')
      .replace(/---[\s\S]*/g, '')
      .split('\n')
      .filter(l => l.trim())
      .join(' ');

    return `=== ELEVENLABS - Voix Off ===

🎙️ TEXTE :
${spokenText}

⚙️ PARAMÈTRES RECOMMANDÉS :
- Stabilité : 0.5 (naturel, pas trop monotone)
- Clarté : 0.75 (bien articulé)
- Style : 0.3-0.5 (expressif mais pas exagéré)
- Langue : Français
- Format : MP3 / WAV`;
  }
};
