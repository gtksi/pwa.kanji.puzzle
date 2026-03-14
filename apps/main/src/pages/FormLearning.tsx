import { useParams, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useCallback } from 'react';

/**
 * カタチ・クエスト: 唱え歌に合わせて部品を習得する
 * PixiJSの代わりにSVG/CSSアニメーションで初期実装
 */
export function FormLearning() {
  const { kanjiId } = useParams<{ kanjiId: string }>();
  const kanji = useGameStore((s) => s.getKanjiById(kanjiId ?? ''));
  const { activeComponentIndex, setActiveComponent, setSpeaking, isSpeaking, updateMastery } = useGameStore();

  const handleSpeak = useCallback(() => {
    if (!kanji || isSpeaking) return;

    setSpeaking(true);
    const components = kanji.writingLayer;
    let currentIndex = 0;

    const speakNext = () => {
      if (currentIndex >= components.length) {
        setActiveComponent(-1);
        setSpeaking(false);
        updateMastery(kanji.kanjiId, 10);
        return;
      }

      setActiveComponent(currentIndex);
      const component = components[currentIndex];
      const utterance = new SpeechSynthesisUtterance(component.speechText);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;
      utterance.onend = () => {
        currentIndex++;
        setTimeout(speakNext, 600);
      };
      speechSynthesis.speak(utterance);
    };

    speakNext();
  }, [kanji, isSpeaking, setActiveComponent, setSpeaking, updateMastery]);

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

  return (
    <div className="learn-container">
      {/* ナビゲーション */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="btn btn--secondary">← テックツリー</Link>
        <Link to={`/meaning/${kanji.kanjiId}`} className="btn btn--secondary">イミ・クエスト →</Link>
      </div>

      {/* 漢字大表示 */}
      <div className="learn-kanji-display">
        {kanji.character}
      </div>

      {/* 部品リスト */}
      <div className="component-list">
        {kanji.writingLayer.map((comp, i) => (
          <div
            key={comp.id}
            className={`component-chip ${activeComponentIndex === i ? 'component-chip--active' : ''}`}
            onClick={() => {
              if (!isSpeaking) {
                const u = new SpeechSynthesisUtterance(comp.speechText);
                u.lang = 'ja-JP';
                u.rate = 0.8;
                speechSynthesis.speak(u);
              }
            }}
            style={activeComponentIndex === i ? { animation: 'float 1s ease-in-out infinite' } : {}}
          >
            <span className="component-chip__order">{comp.chantOrder}</span>
            <span>{comp.name}</span>
          </div>
        ))}
      </div>

      {/* 唱え歌コントロール */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={handleSpeak}
          disabled={isSpeaking}
          className={`btn btn--primary ${!isSpeaking ? 'animate-pulse-glow' : ''}`}
          style={{ fontSize: '16px', padding: '14px 32px' }}
        >
          {isSpeaking ? '🔊 唱え中...' : '▶ 唱え歌スタート'}
        </button>
      </div>

      {/* ヒント */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: '480px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
          💡 「唱え歌スタート」を押すと、部品を順番に読み上げます。<br />
          各部品をタップすると個別に発音を確認できます。
        </p>
      </div>

      {/* 習熟度 */}
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>習熟度</span>
          <span style={{ fontSize: '12px', color: 'var(--color-accent)' }}>{kanji.masteryLevel}%</span>
        </div>
        <div className="tech-node__mastery" style={{ height: '8px' }}>
          <div className="tech-node__mastery-fill" style={{ width: `${kanji.masteryLevel}%` }} />
        </div>
      </div>
    </div>
  );
}
