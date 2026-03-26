import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

/**
 * リコール・クエスト（パズル）
 * 形態学習（カタチ・クエスト）の後に行う、タップで配置するパズルフェーズ
 */
export function RecallLearning() {
  const { kanjiId } = useParams<{ kanjiId: string }>();
  const kanji = useGameStore((s) => s.getKanjiById(kanjiId ?? ''));
  const updateMastery = useGameStore((s) => s.updateMastery);

  const [activePieceIndex, setActivePieceIndex] = useState<number | null>(null);
  const [placedPieces, setPlacedPieces] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorIndex, setErrorIndex] = useState<number | null>(null);

  useEffect(() => {
    if (kanji && kanji.writingLayer.length > 0 && placedPieces.length === kanji.writingLayer.length) {
      if (!isCompleted) {
        setIsCompleted(true);
        updateMastery(kanji.kanjiId, 30); // クリア報酬
      }
    }
  }, [kanji, placedPieces, isCompleted, updateMastery]);

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

  const { writingLayer } = kanji;
  // 並び替えのためのシャッフル（初期状態）
  // 実際には唱え歌の順序(chantOrder)で判定する
  const pieces = writingLayer.map((comp, index) => ({
    ...comp,
    originalIndex: index,
  }));

  const handlePieceTap = (index: number) => {
    if (placedPieces.includes(index) || isCompleted) return;
    setActivePieceIndex(index);
    setErrorIndex(null);
  };

  const handleTargetTap = () => {
    if (activePieceIndex === null || isCompleted) return;

    // 次に配置すべき部品のインデックス（chantOrder順）
    const expectedIndex = pieces.findIndex(p => p.chantOrder === placedPieces.length + 1);

    if (activePieceIndex === expectedIndex) {
      // 正解
      setPlacedPieces(prev => [...prev, activePieceIndex]);
      setActivePieceIndex(null);
      setErrorIndex(null);
      
      const comp = pieces[activePieceIndex];
      const u = new SpeechSynthesisUtterance(comp.speechText);
      u.lang = 'ja-JP';
      u.rate = 0.8;
      speechSynthesis.speak(u);
    } else {
      // 不正解
      setErrorIndex(activePieceIndex);
      setTimeout(() => setErrorIndex(null), 800);
    }
  };

  return (
    <div className="learn-container recall-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* ナビゲーション */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/learn/${kanji.kanjiId}`} className="btn btn--secondary">← カタチ・クエスト</Link>
        {isCompleted && (
          <Link to={`/meaning/${kanji.kanjiId}`} className="btn btn--secondary animate-pulse-glow">
            イミ・クエスト →
          </Link>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '18px', color: 'var(--color-text-bright)', marginBottom: '8px' }}>
          リコール・クエスト
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-dim)' }}>
          唱え歌の順番に部品を配置しよう！
        </p>
      </div>

      {/* ターゲットエリア（配置先） */}
      <div 
        className="puzzle-target-area"
        onClick={handleTargetTap}
        style={{
          width: '280px',
          height: '280px',
          background: 'var(--color-surface-card)',
          border: `2px dashed ${activePieceIndex !== null ? 'var(--color-accent)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: activePieceIndex !== null ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          boxShadow: activePieceIndex !== null ? 'var(--shadow-glow)' : 'none',
        }}
      >
        {/* ゴースト文字（薄く表示） */}
        <div style={{
          position: 'absolute',
          fontSize: '180px',
          fontFamily: 'var(--font-kanji)',
          color: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {kanji.character}
        </div>

        {/* 配置された部品のリスト（実際のグラフィックの代わりに名前を配置） */}
        <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {placedPieces.map(pieceIndex => {
            const piece = pieces[pieceIndex];
            return (
              <div 
                key={`placed-${pieceIndex}`} 
                className="animate-scale-in"
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'var(--color-success)',
                  textShadow: '0 0 10px rgba(52, 211, 153, 0.4)',
                }}
              >
                {piece.name}
              </div>
            );
          })}
        </div>
        
        {isCompleted && (
          <div className="animate-scale-in" style={{
            position: 'absolute',
            background: 'rgba(52, 211, 153, 0.2)',
            border: '2px solid var(--color-success)',
            color: 'var(--color-success)',
            padding: '12px 24px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 'bold',
            fontSize: '20px',
            textShadow: '0 0 8px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
          }}>
            クリア！
          </div>
        )}
      </div>

      {/* 選択エリア（ピース一覧） */}
      <div className="puzzle-pieces-area" style={{ width: '100%', marginTop: '16px' }}>
        <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '12px', textAlign: 'center' }}>
          タップして部品を選び、上の枠をタップして配置
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
          {pieces.map((piece, i) => {
            const isPlaced = placedPieces.includes(i);
            const isActive = activePieceIndex === i;
            const isError = errorIndex === i;

            if (isPlaced) {
               return <div key={`empty-${i}`} style={{ width: '80px', height: '48px' }} />; // プレースホルダー
            }

            return (
              <button
                key={piece.id}
                onClick={() => handlePieceTap(i)}
                className={`puzzle-piece ${isActive ? 'puzzle-piece--active' : ''} ${isError ? 'puzzle-piece--error' : ''}`}
                style={{
                  padding: '12px 16px',
                  background: isActive ? 'var(--color-accent-soft)' : 'var(--color-surface-card)',
                  border: `2px solid ${isActive ? 'var(--color-accent)' : isError ? 'var(--color-danger)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-bright)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transform: isActive ? 'scale(1.05) translateY(-4px)' : isError ? 'scale(0.95)' : 'none',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                  animation: isError ? 'shake 0.4s ease-in-out' : 'none',
                }}
              >
                {piece.name}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* 進行度バー */}
      <div style={{ width: '100%', maxWidth: '280px', marginTop: '8px' }}>
        <div className="tech-node__mastery" style={{ height: '8px', background: 'var(--color-surface-3)' }}>
          <div 
            className="tech-node__mastery-fill" 
            style={{ 
              width: `${(placedPieces.length / Math.max(1, pieces.length)) * 100}%`,
              background: isCompleted ? 'var(--color-success)' : 'var(--gradient-accent)'
            }} 
          />
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: 'var(--color-text-dim)' }}>
          {placedPieces.length} / {pieces.length}
        </div>
      </div>
    </div>
  );
}
