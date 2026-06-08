import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getOllamaBaseUrl, useSettingsStore } from '../store/useSettingsStore';

export function getOllamaGenerateUrl() {
  return `${getOllamaBaseUrl()}/api/generate`;
}

export function getOllamaTagsUrl() {
  return `${getOllamaBaseUrl()}/api/tags`;
}

export function getModel() {
  return useSettingsStore.getState().ollamaModel || 'llama3';
}

/** IP of the dev machine when using Expo Go on a physical device */
export function getSuggestedDevHost() {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri?.replace(/^exp:\/\//, '');
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') return ip;
  }
  return null;
}

export function getDefaultHostHint() {
  if (Platform.OS === 'android') {
    return '10.0.2.2 (Android emulator) or your PC LAN IP';
  }
  if (Platform.OS === 'ios') {
    const suggested = getSuggestedDevHost();
    return suggested
      ? `${suggested} (physical device) or localhost (simulator)`
      : 'localhost (simulator) or your PC LAN IP';
  }
  return 'localhost';
}

export function buildPrompt(
  characters,
  relationships,
  plotSeed,
  worldRules,
  tags = [],
  existingContent = ''
) {
  const charBlocks = characters
    .map(
      (c) => `### ${c.name}${c.race ? ` (${c.race})` : c.role ? ` (${c.role})` : ''}${c.age ? `, age ${c.age}` : ''}
- Personality: ${c.personality || ','}
- Likes: ${c.likes || ','}
- Dislikes: ${c.dislikes || ','}
- Goal: ${c.goal || ','}
- Flaw: ${c.flaw || ','}
- Secret: ${c.secret || ','}
- Appearance: ${c.appearance || ','}`
    )
    .join('\n\n');

  const relBlocks = relationships
    .map((r) => {
      const a = characters.find((c) => c.id === r.charAId);
      const b = characters.find((c) => c.id === r.charBId);
      if (!a || !b) return '';
      return `### ${a.name} ↔ ${b.name}
- ${a.name} toward ${b.name}: ${r.dynamicAToB}
- ${b.name} toward ${a.name}: ${r.dynamicBToA}
- Shared history: ${r.sharedHistory}`;
    })
    .filter(Boolean)
    .join('\n\n');

  const worldBlocks = worldRules
    .map((w) => `- [${w.category}] ${w.ruleText}`)
    .join('\n');

  const tagLine = tags.length > 0 ? tags.join(', ') : '(none specified)';
  const continuation = existingContent?.trim();

  const instructions = continuation
    ? `- Continue the story below seamlessly from where it left off.
- Write the next 500–800 words only, do not repeat what is already written.
- Match the voice, tense, and POV of the existing prose.
- Honor every world rule; do not break established dynamics without earning it.
- End on a beat that could lead to the next scene.
- Do not include meta-commentary, titles, or author notes, only new story prose.`
    : `- Write a single scene of 500–800 words.
- Show, don't tell, use action, dialogue, and sensory detail.
- Stay in third-person limited or close third; pick one POV character from the cast.
- Honor every world rule; do not break established dynamics without earning it.
- End on a beat that could lead to the next scene.
- Do not include meta-commentary, titles, or author notes, only the story prose.`;

  const existingBlock = continuation
    ? `\n## STORY SO FAR (continue from here, do not rewrite)\n${continuation}\n`
    : '';

  return `You are a skilled fiction writer. Write an original fanfiction scene using ONLY the lore below.

## PLOT SEED
Title: ${plotSeed.title}
Logline: ${plotSeed.logline}

## GENRE / TAGS
${tagLine}

## CHARACTERS
${charBlocks || '(none)'}

## RELATIONSHIPS
${relBlocks || '(none defined)'}

## WORLD RULES (must be respected)
${worldBlocks || '(none)'}
${existingBlock}
## INSTRUCTIONS
${instructions}

${continuation ? 'Continue the story:' : 'Begin the scene:'}`;
}

export async function fetchOllamaModels() {
  const url = getOllamaTagsUrl();
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  const data = await res.json();
  return (data.models || []).map((m) => m.name).filter(Boolean);
}

export async function testOllamaConnection() {
  const url = getOllamaTagsUrl();
  try {
    const models = await fetchOllamaModels();
    const model = getModel();
    const hasModel =
      models.length === 0 ||
      models.some(
        (m) => m === model || m.startsWith(`${model}:`) || m.startsWith(model)
      );
    return {
      ok: true,
      url,
      models,
      model,
      hasModel,
      message:
        models.length === 0
          ? 'Connected (no models pulled yet, run: ollama pull llama3)'
          : hasModel
            ? `Connected · ${models.length} model(s)`
            : `Connected, but "${model}" not found. Available: ${models.slice(0, 3).join(', ')}`,
    };
  } catch (e) {
    return {
      ok: false,
      url,
      models: [],
      model: getModel(),
      hasModel: false,
      message: e.message || 'Could not reach Ollama',
    };
  }
}

export async function checkOllamaHealth() {
  const result = await testOllamaConnection();
  return result.ok;
}

export async function generateStory(
  characters,
  relationships,
  plotSeed,
  worldRules,
  tags = [],
  existingContent = ''
) {
  const health = await testOllamaConnection();
  if (!health.ok) {
    throw new Error(
      `${health.message}\n\nCheck Settings → Ollama. URL: ${health.url}\n\n` +
        `• Start Ollama on your PC\n` +
        `• Host: ${getDefaultHostHint()}\n` +
        `• Physical device: use your PC's LAN IP, not localhost`
    );
  }
  if (!health.hasModel && health.models.length > 0) {
    throw new Error(
      `Model "${health.model}" not installed. Run on PC: ollama pull ${health.model}\n\nAvailable: ${health.models.join(', ')}`
    );
  }

  const url = getOllamaGenerateUrl();
  const model = getModel();
  const prompt = buildPrompt(
    characters,
    relationships,
    plotSeed,
    worldRules,
    tags,
    existingContent
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.8,
        num_predict: 1500,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Ollama error (${response.status}): ${text || response.statusText}\nURL: ${url}`
    );
  }

  const data = await response.json();
  return data.response?.trim() || '';
}
