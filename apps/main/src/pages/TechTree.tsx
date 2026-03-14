import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

/**
 * テックツリー画面: スキルツリー + ダッシュボード
 */
export function TechTree() {
  const allKanji = useGameStore((s) => s.kanjiNodes);
  
  // 学年別グループ化
  const kanjiByGrade = new Map<number, typeof allKanji>();
  allKanji.forEach((k) => {
    const arr = kanjiByGrade.get(k.grade) ?? [];
    arr.push(k);
    kanjiByGrade.set(k.grade, arr);
  });

  // 統計
  const totalKanji = allKanji.length;
  const unlockedCount = allKanji.filter((k) => k.isUnlocked).length;
  const masteredCount = allKanji.filter((k) => k.masteryLevel >= 100).length;
  const averageMastery = allKanji.length > 0
    ? Math.round(allKanji.reduce((sum, k) => sum + k.masteryLevel, 0) / totalKanji)
    : 0;

  const grades = Array.from(kanjiByGrade.entries()).sort(([a], [b]) => a - b);

  return (
    <div className="content-area">
      {/* ダッシュボード統計 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        <StatCard label="登録漢字" value={totalKanji} icon="📚" />
        <StatCard label="アンロック" value={`${unlockedCount}/${totalKanji}`} icon="🔓" />
        <StatCard label="マスター" value={masteredCount} icon="⭐" />
        <StatCard label="平均習熟度" value={`${averageMastery}%`} icon="📊" />
      </div>

      {/* 学年別テックツリー */}
      {grades.map(([grade, kanjis]) => (
        <div key={grade} className="grade-section animate-fade-in-up">
          <h2 className="grade-section__title">
            {grade}年生（{kanjis.length}字）
          </h2>
          <div className="tech-tree">
            {kanjis.map((kanji, i) => (
              <KanjiNode key={kanji.kanjiId} kanji={kanji} delay={i * 50} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KanjiNode({ kanji, delay }: { kanji: ReturnType<typeof useGameStore.getState>['kanjiNodes'][0]; delay: number }) {
  const isLocked = !kanji.isUnlocked;
  const isMastered = kanji.masteryLevel >= 100;

  const nodeContent = (
    <div
      className={`tech-node ${isLocked ? 'tech-node--locked' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {isMastered && <span className="tech-node__badge">⭐</span>}
      {isLocked && <span className="tech-node__badge">🔒</span>}
      <span className="tech-node__kanji">{kanji.character}</span>
      <span className="tech-node__name">
        {isLocked ? '???' : kanji.semanticLayer.radicalName}
      </span>
      <div className="tech-node__mastery">
        <div
          className="tech-node__mastery-fill"
          style={{ width: `${kanji.masteryLevel}%` }}
        />
      </div>
    </div>
  );

  if (isLocked) {
    return <div className="animate-fade-in-up">{nodeContent}</div>;
  }

  return (
    <Link
      to={`/learn/${kanji.kanjiId}`}
      className="animate-fade-in-up"
      style={{ textDecoration: 'none' }}
    >
      {nodeContent}
    </Link>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div
      className="animate-scale-in"
      style={{
        padding: '16px 20px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-bright)' }}>
          {value}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {label}
        </div>
      </div>
    </div>
  );
}
