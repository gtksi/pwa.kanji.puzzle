// ========================================
// 1. 書字・形態記憶レイヤー（ミチムラ式）
// ========================================

/** 1画のSVGパスデータ */
export interface StrokeData {
  id: string;
  pathData: string;
}

/** ミチムラ式の部品（唱え歌の1単位） */
export interface MichimuraComponent {
  id: string;
  name: string;
  speechText: string;
  strokes: StrokeData[];
  chantOrder: number;
}

// ========================================
// 2. 意味・語源理解レイヤー（伝統的文字学）
// ========================================

export interface EtymologyData {
  traditionalRadical: string;
  radicalName: string;
  radicalMeaning: string;
  originDescription: string;
  synonyms: string[];
  antonyms: string[];
}

// ========================================
// 3. 語彙データ
// ========================================

export interface VocabularyItem {
  word: string;
  meaning: string;
  imageUrl?: string;
}

// ========================================
// 4. 学習ノード本体
// ========================================

export interface HybridKanjiNode {
  kanjiId: string;
  character: string;
  grade: number;
  isUnlocked: boolean;
  masteryLevel: number;
  lastStudiedAt: number;
  writingLayer: MichimuraComponent[];
  semanticLayer: EtymologyData;
  vocabularies: VocabularyItem[];
}

// ========================================
// 5. アノテーションツール用の型
// ========================================

/** SVGパスID → 部品ID のマッピング */
export type PathAssignments = Record<string, string | null>;

/** アノテーションの作業状態 */
export interface AnnotationState {
  kanji: string;
  grade: number;
  parts: string[];
  activePartId: string | null;
  pathAssignments: PathAssignments;
  etymologyDraft: Partial<EtymologyData>;
  vocabularyDrafts: VocabularyItem[];
}

/** Gemini API レスポンスの型 */
export interface GeminiAnnotationResponse {
  pathMappings: Record<string, string>;
  etymology: EtymologyData;
  vocabularies: VocabularyItem[];
}

// ========================================
// 6. 学習ログ・実績
// ========================================

export interface LearningLog {
  id?: number;
  kanjiId: string;
  mode: 'form' | 'meaning';
  timestamp: number;
  score: number;
  durationMs: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number | null;
  icon: string;
}
