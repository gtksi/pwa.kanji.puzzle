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

const KANJI_BY_GRADE = {
  1: '一右雨円王音下火花貝学気九休玉金空月犬見五口校左三山子四糸字耳七車手十出女小上森人水正生青夕石赤千川先早草足村大男竹中虫町天田土二日入年白八百文木本名目立力林六',
  2: '引羽雲園遠何科夏家歌画回会海絵外角楽活間丸岩顔汽記帰弓牛魚京強教近兄形計元言原戸古午後語工公広交光考行高黄合谷国黒今才細作算止市矢姉思紙寺自時室社弱首秋週春書少場色食心新親図数西声星晴切雪船線前組走多太体台地池知茶昼長鳥朝直通弟店点電刀冬当東答頭同道読内南肉馬売買麦半番父風分聞米歩母方北毎妹万明鳴毛門夜野友用曜来里理話',
  3: '悪安暗医委意育員院飲運泳駅央横屋温化荷界開階寒感漢館岸起期客究急級宮球去橋業曲局銀区苦具君係軽血決研県庫湖向幸港号根祭皿仕死使始指歯詩次事持式実写者主守取酒受州拾終習集住重宿所暑助昭消商章勝乗植申身神真深進世整昔全相送想息速族他打対待代第題炭短談着注柱丁帳調追定庭笛鉄転都度投豆島湯登等動童農波配培倍箱畑反坂板皮悲美鼻筆氷表秒病品負部服福物平返勉放味命面問役薬由油有遊予羊洋葉陽様落流旅両緑礼列練路和',
  4: '愛案以衣位茨印英栄媛塩岡億加果貨課芽賀改械害街各覚潟完官管関観願岐希季旗器機議求泣給挙漁共協鏡競極熊訓軍郡群径景芸欠結建健験固功好香候康佐差菜最埼材崎昨札刷察参産散残氏司試児治滋辞鹿失借種周祝順初松笑唱焼照城縄臣信井成省清静席積折節説浅戦選然争倉巣束側続卒孫帯隊達単置仲沖兆低底的典伝徒努灯働特徳栃奈梨熱念敗梅博阪飯飛必票標不夫付府阜富副兵別辺変便包法望牧末満未民無約勇要養浴利陸良料量輪類令冷例連老労録',
  5: '圧囲移因永営衛易益液演応往桜可仮価河過快解格確額刊幹慣観監基寄規技義逆久旧救居許境均禁句型経潔件険検限現減故個護効厚耕航鉱構興講告混査再災妻採際在財罪殺雑酸賛士支史志枝師資飼示似識質舎謝授修述術準序招証象賞条状常情織職制性政勢精製税責績接設絶祖素葬総造像増則測属率損貸態団断築貯張停提程適統堂銅導得毒独任燃能破犯判版比肥非費備評貧布婦武復複仏粉編弁保墓報豊防貿暴脈務夢迷綿輸余容略留領歴',
  6: '胃異遺域宇映延沿恩我灰拡革閣割株干巻看簡危机揮貴疑吸供胸郷勤筋系敬警劇激穴券絹権憲源厳己呼誤后孝皇紅降鋼刻穀骨困砂座済裁策冊蚕至私姿視詞誌磁射捨尺若樹収宗就衆従縦縮熟純処署諸除承将傷障蒸針仁垂推寸盛聖誠舌宣専泉洗染銭善奏窓創裝層操蔵臓存尊退宅担探誕段暖値宙忠著庁頂腸潮賃痛敵展討党糖届難乳認納脳派拝背肺俳班晩否批秘俵腹奮並陛閉片補暮宝訪亡忘棒枚幕密盟模訳郵優預幼欲翌乱卵覧裏律臨朗論'
};

const TEMP_DIR = './temp_kanji';

const PROMPT_TEMPLATE = (kanjiList, grade) => `
あなたは漢字教育の専門家です。以下の漢字リストについて、${grade}年生向けの学習アプリ用データを一括生成してください。

対象漢字リスト: 「${kanjiList.join('、')}」
学年: ${grade}年生

## 生成ルール
各漢字について以下のデータを生成し、JSON配列形式で出力してください。

1. **etymology（字源）**: 『説文解字』をベースにしつつ、対象学年の子どもにも理解できるように、やさしい日本語で解説してください。
2. **vocabularies（語彙）**: 各漢字につき熟語を2〜3件生成してください。
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
      currentModelIndex = 0; // Reset
      return generateWithRetry(genAI, kanjiList, grade, retryCount + 1);
    }
    console.error(`Error generating for batch ${kanjiList.join(',')}:`, err.message);
    return null;
  }
}

async function generateAll() {
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
  
  const CHUNK_SIZE = 8;
  
  for (const grade of [1, 2, 3, 4, 5, 6]) {
    const kanjiArray = Array.from(KANJI_BY_GRADE[grade]);
    console.log(`--- Grade ${grade} (${kanjiArray.length} kanji) ---`);
    
    for (let i = 0; i < kanjiArray.length; i += CHUNK_SIZE) {
      const chunk = kanjiArray.slice(i, i + CHUNK_SIZE);
      const toProcess = chunk.filter(k => !fs.existsSync(path.join(TEMP_DIR, `${k}.json`)));
      
      if (toProcess.length === 0) {
        // console.log(`[Grade ${grade}] [${i + 1}-${Math.min(i + CHUNK_SIZE, kanjiArray.length)}] Skipping (all exist)`);
        continue;
      }
      
      console.log(`[Grade ${grade}] [${i + 1}-${Math.min(i + CHUNK_SIZE, kanjiArray.length)}] Generating: ${toProcess.join(', ')}`);
      const results = await generateWithRetry(genAI, toProcess, grade);
      
      if (results && Array.isArray(results)) {
        results.forEach(data => {
          const kanji = data.character;
          data.kanjiId = kanji;
          data.grade = grade;
          data.isUnlocked = true;
          fs.writeFileSync(path.join(TEMP_DIR, `${kanji}.json`), JSON.stringify(data, null, 2));
          console.log(`Saved ${kanji}`);
        });
      }
      
      console.log("Waiting 30 seconds between batches...");
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  // Final merge
  console.log("Merging all generated data...");
  const combined = [];
  for (const grade of [1, 2, 3, 4, 5, 6]) {
    const kanjiArray = Array.from(KANJI_BY_GRADE[grade]);
    kanjiArray.forEach(kanji => {
      const tempFile = path.join(TEMP_DIR, `${kanji}.json`);
      if (fs.existsSync(tempFile)) {
        combined.push(JSON.parse(fs.readFileSync(tempFile, 'utf8')));
      }
    });
  }
  
  const outputPath = './apps/main/src/data/kanji-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(combined, null, 2));
  console.log(`DONE. Total ${combined.length} kanji saved to ${outputPath}`);
}

generateAll();
