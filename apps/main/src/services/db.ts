import Dexie, { type EntityTable } from 'dexie';

export interface KanjiProgress {
  kanjiId: string;
  isUnlocked: boolean;
  masteryLevel: number;
  lastStudiedAt: number;
}

const db = new Dexie('KanjiPuzzleDB') as Dexie & {
  progress: EntityTable<KanjiProgress, 'kanjiId'>;
};

db.version(1).stores({
  progress: 'kanjiId' // Primary key, indexing only kanjiId
});

export { db };
