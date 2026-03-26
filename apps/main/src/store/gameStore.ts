import { create } from 'zustand';
import type { HybridKanjiNode } from '@kanji-puzzle/shared';
import kanjiDataJson from '../data/kanji-data.json';
import { db } from '../services/db';

interface GameStore {
  kanjiNodes: HybridKanjiNode[];
  currentKanjiId: string | null;
  isSpeaking: boolean;
  activeComponentIndex: number;

  // Actions
  initProgress: () => Promise<void>;
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

  initProgress: async () => {
    try {
      const allProgress = await db.progress.toArray();
      const progressMap = new Map(allProgress.map(p => [p.kanjiId, p]));

      set((s) => ({
        kanjiNodes: s.kanjiNodes.map((k) => {
          const p = progressMap.get(k.kanjiId);
          if (p) {
            return {
              ...k,
              isUnlocked: p.isUnlocked,
              masteryLevel: p.masteryLevel,
              lastStudiedAt: p.lastStudiedAt
            };
          }
          return k;
        })
      }));
    } catch (e) {
      console.error('Failed to load progress from IndexedDB:', e);
    }
  },

  setCurrentKanji: (id) => set({ currentKanjiId: id, activeComponentIndex: -1 }),
  clearCurrentKanji: () => set({ currentKanjiId: null, activeComponentIndex: -1 }),

  getKanjiById: (id) => get().kanjiNodes.find((k) => k.kanjiId === id),

  getUnlockedKanji: () => get().kanjiNodes.filter((k) => k.isUnlocked),
  getLockedKanji: () => get().kanjiNodes.filter((k) => !k.isUnlocked),

  setActiveComponent: (index) => set({ activeComponentIndex: index }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),

  updateMastery: (kanjiId, delta) =>
    set((s) => {
      const newNodes = s.kanjiNodes.map((k) => {
        if (k.kanjiId === kanjiId) {
          const updated = {
            ...k,
            masteryLevel: Math.max(0, Math.min(100, k.masteryLevel + delta)),
            lastStudiedAt: Date.now()
          };
          
          // 非同期でDBに保存
          db.progress.put({
            kanjiId: updated.kanjiId,
            isUnlocked: updated.isUnlocked,
            masteryLevel: updated.masteryLevel,
            lastStudiedAt: updated.lastStudiedAt
          }).catch(console.error);
          
          return updated;
        }
        return k;
      });
      return { kanjiNodes: newNodes };
    }),

  unlockKanji: (kanjiId) =>
    set((s) => {
      const newNodes = s.kanjiNodes.map((k) => {
        if (k.kanjiId === kanjiId) {
          const updated = { ...k, isUnlocked: true };
          
          db.progress.put({
            kanjiId: updated.kanjiId,
            isUnlocked: updated.isUnlocked,
            masteryLevel: updated.masteryLevel,
            lastStudiedAt: updated.lastStudiedAt
          }).catch(console.error);
          
          return updated;
        }
        return k;
      });
      return { kanjiNodes: newNodes };
    }),
}));
