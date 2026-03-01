# AI Smart Video Editor Pro (MVP Core)

Это **практический MVP-скелет** движка для AI-видеомонтажа: авто-нарезка, базовый viral scoring, beat detection и пресеты экспорта под вертикальные платформы.

## Что уже реализовано в коде

- `analysis/audio-analysis`:
  - поиск пауз по амплитуде (`detectPauseSegments`)
  - упрощённый beat detector (`detectBeatTimestamps`)
- `analysis/speech-analysis`:
  - поиск слов-паразитов и повторов (`detectSpeechIssues`)
  - поиск ключевых фраз (`extractKeywordMoments`)
- `editing-core/auto-cut`:
  - формирование плана удалений (`pause/filler/repeat`) и keep-candidates по ключевым моментам
- `ai/viral-score`:
  - расчёт viral score 0..100
  - генерация hook-заголовков
- `export/presets`:
  - пресеты TikTok / Shorts / Reels (9:16)
- `pipeline/mvp-plan`:
  - единая функция `buildMvpPlan`, которая связывает всё в один результат

## Структура

```text
src/
  analysis/
  ai/
  editing-core/
  export/
  pipeline/
  index.js
test/
  mvp.test.js
```

## Быстрый старт

```bash
npm test
```

## Пример использования

```js
import { buildMvpPlan } from './src/index.js';

const plan = buildMvpPlan({
  audioFrames: [0.1, 0.8, 0.2, 0.9, 0.1],
  transcriptTokens: [{ text: 'старт', startMs: 0, endMs: 300 }],
  transcriptPhrases: [{ text: 'как набрать просмотры быстро', startMs: 0, endMs: 2200 }],
  keywords: ['просмотры'],
  factors: { emotion: 0.8, pace: 0.7, loudness: 0.6, semanticNovelty: 0.75 },
  topic: 'виральные видео',
  platform: 'shorts',
  exportOverride: { fps: 60 },
});

console.log(plan);
```

## Что дальше (следующий шаг)

1. Подключить реальные источники данных:
   - Web Audio API для `audioFrames`
   - Whisper/Groq для транскрипта и semantic сигналов
2. Добавить timeline слой и операции trim/split на основе `autoCut`
3. Подключить ffmpeg.wasm/WebCodecs экспорт по `exportPreset`

