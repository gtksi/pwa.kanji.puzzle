import { create } from 'zustand';
import type { HybridKanjiNode } from '@kanji-puzzle/shared';
import kanjiDataJson from '../data/kanji-data.json';

interface GameStore {
  kanjiNodes: HybridKanjiNode[];
  currentKanjiId: string | null;
  isSpeaking: boolean;
  activeComponentIndex: number;

  // Actions
  setCurrentKanji: (id: string) => void;
  clearCurrentKanji: () => void;
  getKanjiById: (id: string) => HybridKanjiNode | undefined;
  getUnlockedKanji: () => HybridKanjiNode[];
  getLockedKanji: () => HybridKanjiNode[];
  setActiveComponent: (index: number) => void;
  setSpeaking: (speaking: boolean) => void;
  updateMastery: (kanjiId: string, delta: number) => void;
  unlockKanji: (kanjiId: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  kanjiNodes: kanjiDataJson as HybridKanjiNode[],
  currentKanjiId: null,
  isSpeaking: false,
  activeComponentIndex: -1,

  setCurrentKanji: (id) => set({ currentKanjiId: id, activeComponentIndex: -1 }),
  clearCurrentKanji: () => set({ currentKanjiId: null, activeComponentIndex: -1 }),

  getKanjiById: (id) => get().kanjiNodes.find((k) => k.kanjiId === id),

  getUnlockedKanji: () => get().kanjiNodes.filter((k) => k.isUnlocked),
  getLockedKanji: () => get().kanjiNodes.filter((k) => !k.isUnlocked),

  setActiveComponent: (index) => set({ activeComponentIndex: index }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),

  updateMastery: (kanjiId, delta) =>
    set((s) => ({
      kanjiNodes: s.kanjiNodes.map((k) =>
        k.kanjiId === kanjiId
          ? { ...k, masteryLevel: Math.max(0, Math.min(100, k.masteryLevel + delta)), lastStudiedAt: Date.now() }
          : k
      ),
    })),

  unlockKanji: (kanjiId) =>
    set((s) => ({
      kanjiNodes: s.kanjiNodes.map((k) =>
        k.kanjiId === kanjiId ? { ...k, isUnlocked: true } : k
      ),
    })),
}));
