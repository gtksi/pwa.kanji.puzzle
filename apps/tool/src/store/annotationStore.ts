import { create } from 'zustand';
import type { PathAssignments, EtymologyData, VocabularyItem } from '@kanji-puzzle/shared';

// ===== 部品に割り当てるカラーパレット =====
export const PART_COLORS = [
  '#6c63ff', // indigo
  '#34d399', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#06b6d4', // cyan
  '#a855f7', // purple
  '#84cc16', // lime
  '#fb923c', // orange
  '#e879f9', // fuchsia
  '#2dd4bf', // teal
];

export const UNASSIGNED_COLOR = '#ff00ff'; // magenta

export interface PartInfo {
  id: string;
  name: string;
  color: string;
}

interface AnnotationStore {
  // === Input ===
  kanji: string;
  grade: number;
  parts: PartInfo[];

  // === SVG ===
  svgContent: string;
  pathIds: string[];

  // === Assignment (Single Source of Truth) ===
  activePartId: string | null;
  pathAssignments: PathAssignments;

  // === Semantic ===
  etymology: Partial<EtymologyData>;
  vocabularies: VocabularyItem[];

  // === UI State ===
  isLoading: boolean;
  error: string | null;

  // === Actions ===
  setKanji: (kanji: string) => void;
  setGrade: (grade: number) => void;
  setParts: (partNames: string[]) => void;
  setSvgContent: (svg: string, pathIds: string[]) => void;
  setActivePartId: (id: string | null) => void;
  assignPath: (pathId: string) => void;
  unassignPath: (pathId: string) => void;
  setEtymology: (data: Partial<EtymologyData>) => void;
  setVocabularies: (vocabs: VocabularyItem[]) => void;
  updateVocabulary: (index: number, vocab: VocabularyItem) => void;
  addVocabulary: () => void;
  removeVocabulary: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadApiResult: (assignments: Record<string, string>, etymology: EtymologyData, vocabs: VocabularyItem[]) => void;
  reset: () => void;
  exportJson: () => object;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  kanji: '',
  grade: 1,
  parts: [],
  svgContent: '',
  pathIds: [],
  activePartId: null,
  pathAssignments: {},
  etymology: {},
  vocabularies: [],
  isLoading: false,
  error: null,

  setKanji: (kanji) => set({ kanji }),
  setGrade: (grade) => set({ grade }),

  setParts: (partNames) => {
    const parts: PartInfo[] = partNames.map((name, i) => ({
      id: `part-${i}`,
      name: name.trim(),
      color: PART_COLORS[i % PART_COLORS.length],
    }));
    set({ parts, activePartId: parts.length > 0 ? parts[0].id : null });
  },

  setSvgContent: (svgContent, pathIds) => {
    const pathAssignments: PathAssignments = {};
    pathIds.forEach((id) => { pathAssignments[id] = null; });
    set({ svgContent, pathIds, pathAssignments });
  },

  setActivePartId: (id) => set({ activePartId: id }),

  assignPath: (pathId) => {
    const { activePartId, pathAssignments } = get();
    if (!activePartId) return;
    set({
      pathAssignments: { ...pathAssignments, [pathId]: activePartId },
    });
  },

  unassignPath: (pathId) => {
    const { pathAssignments } = get();
    set({
      pathAssignments: { ...pathAssignments, [pathId]: null },
    });
  },

  setEtymology: (data) => set((s) => ({ etymology: { ...s.etymology, ...data } })),

  setVocabularies: (vocabs) => set({ vocabularies: vocabs }),

  updateVocabulary: (index, vocab) =>
    set((s) => {
      const vocabs = [...s.vocabularies];
      vocabs[index] = vocab;
      return { vocabularies: vocabs };
    }),

  addVocabulary: () =>
    set((s) => ({
      vocabularies: [...s.vocabularies, { word: '', meaning: '' }],
    })),

  removeVocabulary: (index) =>
    set((s) => ({
      vocabularies: s.vocabularies.filter((_, i) => i !== index),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  loadApiResult: (assignments, etymology, vocabs) => {
    const { pathIds, parts } = get();
    const nameToId = new Map(parts.map((p) => [p.name, p.id]));
    const pathAssignments: PathAssignments = {};
    pathIds.forEach((id) => {
      const partName = assignments[id];
      pathAssignments[id] = partName ? (nameToId.get(partName) ?? null) : null;
    });
    set({ pathAssignments, etymology, vocabularies: vocabs });
  },

  reset: () =>
    set({
      kanji: '',
      grade: 1,
      parts: [],
      svgContent: '',
      pathIds: [],
      activePartId: null,
      pathAssignments: {},
      etymology: {},
      vocabularies: [],
      isLoading: false,
      error: null,
    }),

  exportJson: () => {
    const { kanji, grade, parts, pathAssignments, etymology, vocabularies } = get();
    const partIdToName = new Map(parts.map((p) => [p.id, p.name]));
    const writingLayer = parts.map((part, i) => ({
      id: part.id,
      name: part.name,
      speechText: part.name,
      strokes: Object.entries(pathAssignments)
        .filter(([, pid]) => pid === part.id)
        .map(([pathId]) => ({ id: pathId, pathData: '' })),
      chantOrder: i + 1,
    }));
    return {
      kanjiId: kanji,
      character: kanji,
      grade,
      isUnlocked: false,
      masteryLevel: 0,
      lastStudiedAt: 0,
      writingLayer,
      semanticLayer: etymology,
      vocabularies,
    };
  },
}));
