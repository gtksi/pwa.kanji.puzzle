import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Error: VITE_GEMINI_API_KEY is not set in environment');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-2.5-pro'
];
let currentModelIndex = 0;

function getModel(genAI) {
  return genAI.getGenerativeModel({
    model: MODELS[currentModelIndex],
    generationConfig: { responseMimeType: 'application/json' },
  });
}

// Read kanji lists from file
const kanjiLists = JSON.parse(fs.readFileSync('./kanji_lists.json', 'utf8'));
const TARGET_GRADES = (process.env.GRADES || '2,3,4,5,6').split(',');

const TEMP_DIR = './temp_kanji';

const PROMPT_TEMPLATE = (kanjiList, grade) => `
あなたは漢字教育の専門家です。以下の漢字リストについて、${grade}年生向け（11〜12歳までを対象とした平易な表現）の学習アプリ用データを一括生成してください。

対象漢字リスト: 「${kanjiList.join('、')}」
学年: ${grade}年生

## 生成ルール
各漢字について以下のデータを生成し、JSON配列形式で出力してください。

1. **etymology（字源）**: 『説文解字』をベースにしつつ、11〜12歳の子どもにも理解できるように、やさしい日本語で解説してください。
2. **vocabularies（語彙）**: 各漢字につき熟語を2〜3件生成してください。熟語はその学年かそれ以下の学年で習う漢字を優先して使い、意味も平易に説明してください。
3. **writingLayer（形態レイヤー）**: 漢字の構成部品を、ミチムラ式の唱え歌として読み上げられる形でリスト化してください。
   - speechText は子どもが唱えて覚えやすい表現にしてください。
   - id は "p1", "p2" ... としてください。
   - strokes は空の配列 [] で良いですが、構造は維持してください。

出力フォーマット（JSON配列）:
[
  {
    "kanjiId": "漢字",
    "character": "漢字",
    "grade": ${grade},
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
  },
  ...
]
`;

async function generateWithRetry(genAI, kanjiList, grade, retryCount = 0) {
  try {
    const model = getModel(genAI);
    const result = await model.generateContent(PROMPT_TEMPLATE(kanjiList, grade));
    const text = result.response.text();
    const data = JSON.parse(text);
    return data;
  } catch (err) {
    if (err.status === 429 && retryCount < 10) {
      if (currentModelIndex < MODELS.length - 1) {
        currentModelIndex++;
        console.log(`Quota hit for ${MODELS[currentModelIndex-1]}. Switching to ${MODELS[currentModelIndex]}...`);
        return generateWithRetry(genAI, kanjiList, grade, retryCount);
      }
      const waitTime = 60000;
      console.log(`All models rate limited. Waiting 60s for batch ${kanjiList.join(',')}...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      currentModelIndex = 0; // Reset to try all models again
      return generateWithRetry(genAI, kanjiList, grade, retryCount + 1);
    }
    console.error(`Error generating for batch ${kanjiList.join(',')}:`, err.message);
    return null;
  }
}

async function generateAll() {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
  
  const CHUNK_SIZE = 8;
  
  for (const grade of TARGET_GRADES) {
    const kanjiArray = Array.from(kanjiLists[grade]);
    console.log(`\n--- Starting Grade ${grade} (${kanjiArray.length} characters) ---`);
    
    for (let i = 0; i < kanjiArray.length; i += CHUNK_SIZE) {
      const chunk = kanjiArray.slice(i, i + CHUNK_SIZE);
      const toProcess = chunk.filter(k => !fs.existsSync(path.join(TEMP_DIR, `${k}.json`)));
      
      if (toProcess.length === 0) {
        console.log(`[Grade ${grade}] [${i + 1}-${Math.min(i + CHUNK_SIZE, kanjiArray.length)}/${kanjiArray.length}] Skipping (all exist)`);
        continue;
      }
      
      console.log(`[Grade ${grade}] [${i + 1}-${Math.min(i + CHUNK_SIZE, kanjiArray.length)}/${kanjiArray.length}] Generating batch: ${toProcess.join(', ')}`);
      const results = await generateWithRetry(genAI, toProcess, grade);
      
      if (results && Array.isArray(results)) {
        results.forEach(data => {
          const kanji = data.character;
          data.kanjiId = kanji;
          data.grade = parseInt(grade);
          data.isUnlocked = true;
          fs.writeFileSync(path.join(TEMP_DIR, `${kanji}.json`), JSON.stringify(data, null, 2));
          console.log(`Saved ${kanji}`);
        });
      } else {
        console.error(`Failed to get array results for batch ${toProcess.join(',')}`);
      }
      
      console.log("Waiting 30 seconds between batches...");
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  // Final Merge
  console.log("\n--- Consolidating all data ---");
  const finalResults = [];
  const allGrades = Object.keys(kanjiLists).sort();
  for (const grade of allGrades) {
    const kanjiArray = Array.from(kanjiLists[grade]);
    kanjiArray.forEach(kanji => {
      const tempFile = path.join(TEMP_DIR, `${kanji}.json`);
      if (fs.existsSync(tempFile)) {
        try {
          finalResults.push(JSON.parse(fs.readFileSync(tempFile, 'utf8')));
        } catch (e) {
          console.error(`Error reading ${tempFile}:`, e.message);
        }
      }
    });
  }
  
  const outputPath = './apps/main/src/data/kanji-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(finalResults, null, 2));
  console.log(`DONE. Successfully merged ${finalResults.length} kanji at ${outputPath}`);
}

generateAll();
