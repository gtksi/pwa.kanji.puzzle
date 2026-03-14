======================================================================
【1】 ミチムラ式漢字学習法 PWAアプリ（メイン） 統合仕様書
======================================================================

## 1. アプリケーション概要
「何度も書かずに唱えておぼえる」[cite: 165]というミチムラ式漢字学習法のメソッドをデジタル化し、多感覚インプットを最大化する学習アプリケーション。学習者のメタ認知を促進する統計機能と、ゲーミフィケーション要素を統合し、「言葉の世界を広げる」[cite: 145]という最終目標を達成する。

### ターゲットユーザー
* 書くことをいやがり宿題から逃げ回るなど、漢字の反復練習に困難や抵抗を感じる小学生[cite: 153]。
* 私立中学入試（南山中男子部など）を見据え、漢字の構造的理解と高度な語彙運用能力を身につけたい11〜12歳の高学年児童[cite: 157]。

### コアバリュー
* 書くための練習は最小限の努力でクリアさせる[cite: 169]。
* 丸暗記から、部品を通して形や書き方がつながる「理解して覚える学習」への転換[cite: 167]。
* 読める・使える・知ってる言葉を増やす語彙学習の実現[cite: 168]。
* キャリブレーション分析によるメタ認知の向上と、テックツリーによるモチベーション維持。

---

## 2. 技術スタック
* Frontend: React (Functional Components + Hooks), TypeScript
* Canvas Rendering: PixiJS (`@pixi/react`) - WebGLによる高速描画
* Architecture: PWA (Service Workerによるオフライン対応)
* APIs: Web Speech API (ブラウザネイティブの動的音声合成)
* Database: IndexedDB (Dexie.js) - クライアントサイドでの学習ログ・アンロック状態の永続化
* Charts: Recharts または Chart.js

---

## 3. UI/UX仕様
### 3.1. ゲーミフィケーション（テックツリーUI）
* 基本部品（「さんずい」等）の習得により、上位の漢字ノードが解放されるスキルツリー画面。
* 連続学習日数やコンプリート率に応じたバッジ・称号システム。

### 3.2. 形態学習モード（PixiJS + 音声同期）
* KanjiVGベースのSVGパスを部品ごとにグループ化してキャンバス描画。
* ガイド音声の再生（確認用・練習用の速度制御）に同期し、キャンバス上の該当部品がハイライトされるクロスモーダルUI。

### 3.3. 意味学習モード（段階的開示・ハイブリッドUI）
* 形態学習クリア後にアンロックされる『説文解字』ベースの字源・成り立ち解説画面。
* 漢字一字につき最大6つの言葉に意味や状況がわかりやすいイメージ写真を提示[cite: 129]し、同音異義語等の高度な語彙ネットワークを構築。

---

## 4. データモデル (TypeScript Interfaces)
```typescript
// 1. 書字・形態記憶レイヤー（ミチムラ式）
interface MichimuraComponent {
  id: string;
  name: string;
  speechText: string;
  strokes: { id: string; pathData: string }[];
  chantOrder: number;
}

// 2. 意味・語源理解レイヤー（伝統的文字学）
interface EtymologyData {
  traditionalRadical: string;
  radicalName: string;
  radicalMeaning: string;
  originDescription: string;
  synonyms: string[];
  antonyms: string[];
}

// 3. 学習ノード本体
interface HybridKanjiNode {
  kanjiId: string;
  grade: number;
  isUnlocked: boolean;
  masteryLevel: number;
  lastStudiedAt: number;
  writingLayer: MichimuraComponent[];
  semanticLayer: EtymologyData;
  vocabularies: { word: string; meaning: string; imageUrl?: string }[];
}
```
