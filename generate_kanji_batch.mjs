import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Error: VITE_GEMINI_API_KEY is not set in environment');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash', 
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

const KANJI_LIST_G1 = '一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六';
const kanjiArray = Array.from(KANJI_LIST_G1);

const PROMPT_TEMPLATE = (kanji) => `
あなたは漢字教育の専門家です。以下の漢字について、1年生向けの学習アプリ用データを生成してください。

対象漢字: 「${kanji}」
学年: 1年生

## 生成ルール
1. **etymology（字源）**: 『説文解字』をベースにしつつ、11〜12歳の子どもにも理解できるように、やさしい日本語で解説してください。
2. **vocabularies（語彙）**: この漢字を含む熟語を2〜3件生成してください。
3. **writingLayer（形態レイヤー）**: 漢字の構成部品を、ミチムラ式の唱え歌として読み上げられる形でリスト化してください。
   - speechText は子どもが唱えて覚えやすい表現にしてください。
   - id は "p1", "p2" ... としてください。
   - strokes は空の配列 [] で良いですが、構造は維持してください。

以下の JSON フォーマットで出力してください。

{
  "kanjiId": "${kanji}",
  "character": "${kanji}",
  "grade": 1,
  "writingLayer": [
    { "id": "p1", "name": "部品名", "speechText": "唱え歌", "chantOrder": 1, "strokes": [] }
  ],
  "semanticLayer": {
    "traditionalRadical": "部首1文字",
    "radicalName": "部首の読み",
    "radicalMeaning": "部首の意味",
    "originDescription": "字源解説（50-100文字）",
    "synonyms": [],
    "antonyms": []
  },
  "vocabularies": [
    { "word": "熟語", "meaning": "意味", "imageUrl": "" }
  ],
  "masteryLevel": 0,
  "lastStudiedAt": 0,
  "isUnlocked": true
}
`;

async function generateWithRetry(kanji, retryCount = 0) {
  try {
    const result = await model.generateContent(PROMPT_TEMPLATE(kanji));
    const text = result.response.text();
    const data = JSON.parse(text);
    return data;
  } catch (err) {
    if (err.status === 429 && retryCount < 10) {
      const waitTime = (retryCount + 1) * 30000;
      console.log(`Rate limited for ${kanji}. Retrying in ${waitTime/1000}s... (Attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return generateWithRetry(kanji, retryCount + 1);
    }
    console.error(`Error generating for ${kanji}:`, err.message);
    return null;
  }
}

async function generateAll() {
  const results = [];
  console.log(`Starting sequential generation for ${kanjiArray.length} kanji...`);
  
  for (let i = 0; i < kanjiArray.length; i++) {
    const kanji = kanjiArray[i];
    console.log(`[${i + 1}/80] Processing: ${kanji}`);
    
    const data = await generateWithRetry(kanji);
    if (data) {
      data.kanjiId = kanji;
      data.character = kanji;
      data.grade = 1;
      data.isUnlocked = true;
      results.push(data);
    }
    
    // Default wait to stay under 15 RPM (6 seconds delay)
    await new Promise(resolve => setTimeout(resolve, 6000));
  }
  
  const outputPath = './apps/main/src/data/kanji-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Successfully generated data for ${results.length} kanji at ${outputPath}`);
}

generateAll();
