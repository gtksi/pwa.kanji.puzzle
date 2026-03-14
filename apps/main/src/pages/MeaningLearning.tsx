import { useParams, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

/**
 * イミ・クエスト: 字源解説 + 語彙ネットワーク
 * カタチ・クエストクリア後にアンロック
 */
export function MeaningLearning() {
  const { kanjiId } = useParams<{ kanjiId: string }>();
  const kanji = useGameStore((s) => s.getKanjiById(kanjiId ?? ''));

  if (!kanji) {
    return (
      <div className="content-area" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <p style={{ color: 'var(--color-text-dim)' }}>漢字が見つかりません</p>
        <Link to="/" className="btn btn--secondary" style={{ marginTop: '16px', display: 'inline-flex' }}>
          ← 戻る
        </Link>
      </div>
    );
  }

  const { semanticLayer, vocabularies } = kanji;

  return (
    <div className="learn-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* ナビゲーション */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/learn/${kanji.kanjiId}`} className="btn btn--secondary">← カタチ・クエスト</Link>
        <Link to="/" className="btn btn--secondary">テックツリー →</Link>
      </div>

      {/* 漢字 + 部首情報 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="learn-kanji-display" style={{ fontSize: '140px' }}>
          {kanji.character}
        </div>
        <div
          className="animate-fade-in-up"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <RadicalTag label="部首" value={`${semanticLayer.traditionalRadical}（${semanticLayer.radicalName}）`} />
          <RadicalTag label="部首の意味" value={semanticLayer.radicalMeaning} />
        </div>
      </div>

      {/* 字源解説 */}
      <div className="etymology-section animate-fade-in-up" style={{ width: '100%', animationDelay: '100ms' }}>
        <div className="etymology-section__title">📖 字源・成り立ち</div>
        <div className="etymology-section__content">
          {semanticLayer.originDescription}
        </div>
      </div>

      {/* 同義語・反義語 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          width: '100%',
        }}
        className="animate-fade-in-up"
      >
        <div style={{
          padding: '16px 20px',
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            同義語
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {semanticLayer.synonyms.map((s) => (
              <span
                key={s}
                style={{
                  padding: '4px 12px',
                  background: 'var(--color-accent-soft)',
                  border: '1px solid var(--color-accent)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: 'var(--color-accent-glow)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div style={{
          padding: '16px 20px',
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            反義語
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {semanticLayer.antonyms.map((a) => (
              <span
                key={a}
                style={{
                  padding: '4px 12px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: '20px',
                  fontSize: '14px',
                  color: 'var(--color-danger)',
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 語彙カード */}
      <div style={{ width: '100%' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px',
        }}>
          📝 語彙ネットワーク
        </h3>
        <div className="vocab-grid">
          {vocabularies.map((vocab, i) => (
            <div
              key={vocab.word}
              className="vocab-card animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="vocab-card__word">{vocab.word}</div>
              <div className="vocab-card__meaning">{vocab.meaning}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RadicalTag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}>
      <span style={{
        fontSize: '10px',
        color: 'var(--color-text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        minWidth: '64px',
      }}>
        {label}
      </span>
      <span style={{
        padding: '4px 12px',
        background: 'var(--color-surface-3)',
        borderRadius: 'var(--radius-md)',
        fontSize: '15px',
        color: 'var(--color-text-bright)',
      }}>
        {value}
      </span>
    </div>
  );
}
