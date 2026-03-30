import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { EtymologyData, VocabularyItem } from '@kanji-puzzle/shared';

// ===== Gemini API クライアント初期化 =====
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

function getClient() {
  if (!API_KEY) {
    throw new Error(
      'VITE_GEMINI_API_KEY が設定されていません。\n' +
      'apps/tool/.env に VITE_GEMINI_API_KEY=your_key を追加してください。'
    );
  }
  return new GoogleGenerativeAI(API_KEY);
}

// ===== レスポンスの型 =====
export interface GeminiGenerateResult {
  etymology: EtymologyData;
  vocabularies: VocabularyItem[];
  writingLayer: {
    id: string;
    name: string;
    speechText: string;
    chantOrder: number;
  }[];
}

// ===== JSON スキーマ定義（Structured Output 用）=====
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    etymology: {
      type: SchemaType.OBJECT,
      properties: {
        traditionalRadical: { type: SchemaType.STRING, description: '部首（漢字1文字）' },
        radicalName: { type: SchemaType.STRING, description: '部首の読み方' },
        radicalMeaning: { type: SchemaType.STRING, description: '部首の意味' },
        originDescription: { type: SchemaType.STRING, description: '11〜12歳向けの字源解説（50〜100文字）' },
        synonyms: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: '同義語・関連漢字（2〜3個）',
        },
        antonyms: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: '反義語・対照漢字（2〜3個）',
        },
      },
      required: ['traditionalRadical', 'radicalName', 'radicalMeaning', 'originDescription', 'synonyms', 'antonyms'],
    },
    vocabularies: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          word: { type: SchemaType.STRING, description: '熟語' },
          meaning: { type: SchemaType.STRING, description: '簡潔な意味説明（20文字以内）' },
        },
        required: ['word', 'meaning'],
      },
      description: '該当漢字を含む熟語（3〜5件、中学入試レベル含む）',
    },
    writingLayer: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING, description: '部品の一意ID（例: part-0）' },
          name: { type: SchemaType.STRING, description: '部品名' },
          speechText: { type: SchemaType.STRING, description: '唱え歌用テキスト' },
          chantOrder: { type: SchemaType.NUMBER, description: '唱え順（1始まり）' },
        },
        required: ['id', 'name', 'speechText', 'chantOrder'],
      },
      description: '漢字の構成部品リスト（唱え歌の順番で）',
    },
  },
  required: ['etymology', 'vocabularies', 'writingLayer'],
};

// ===== メインのデータ生成関数 =====
export async function generateKanjiData(
  kanji: string,
  grade: number,
  partNames?: string[],
): Promise<GeminiGenerateResult> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA as any,
    },
  });

  const partsContext = partNames && partNames.length > 0
    ? `\nこの漢字のミチムラ式部品リスト: ${partNames.join('、')}\nこの部品リストに基づいて writingLayer を構築してください。`
    : `\nこの漢字の構成部品を分析し、writingLayer を自動的に推定してください。`;

  const prompt = `
あなたは漢字教育の専門家です。以下の漢字について、学習アプリ用のデータを生成してください。

対象漢字: 「${kanji}」
学年: ${grade}年生
${partsContext}

## 生成ルール
1. **etymology（字源）**: 『説文解字』をベースにしつつ、11〜12歳の子どもにも理解できるように、やさしい日本語で解説してください。残酷な表現は避けてください。
2. **vocabularies（語彙）**: この漢字を含む熟語を3〜5件生成してください。日常語に加え、中学入試レベルの語も含めてください。
3. **writingLayer（形態レイヤー）**: 漢字の構成部品を、書き順に従って唱え歌として読み上げられる形でリスト化してください。
   - speechText は子どもが唱えて覚えやすい表現にしてください（例: 「たてぼう」「くさかんむり」「よこ」等）。
   - id は "part-0", "part-1" のように連番にしてください。

データを JSON で出力してください。
`.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text) as GeminiGenerateResult;
  return parsed;
}
