import { useAnnotationStore, UNASSIGNED_COLOR } from '../store/annotationStore';
import { generateKanjiData } from '../services/geminiService';

/**
 * 左ペイン: 漢字・部品入力 + API制御
 */
export function InputPane() {
  const {
    kanji, grade, parts, isLoading, error,
    setKanji, setGrade, setParts, setLoading, setError, loadApiResult,
    svgContent, setSvgContent,
    setEtymology, setVocabularies,
  } = useAnnotationStore();

  const handlePartsInput = (value: string) => {
    const names = value.split(/[,、]/).map((s) => s.trim()).filter(Boolean);
    setParts(names);
  };

  const handleLoadSvg = async () => {
    if (!kanji) return;
    setLoading(true);
    setError(null);
    try {
      // KanjiVG のコードポイントからファイル名を生成
      const codePoint = kanji.codePointAt(0)?.toString(16).padStart(5, '0');
      const res = await fetch(`/api/kanjivg/${codePoint}`);
      if (!res.ok) {
        // フォールバック: サンプルSVGを使用
        const sampleRes = await fetch(`/sample-kanji/${codePoint}.svg`);
        if (!sampleRes.ok) throw new Error(`SVG not found for ${kanji}`);
        const svgText = await sampleRes.text();
        const pathIds = extractPathIds(svgText);
        setSvgContent(svgText, pathIds);
      } else {
        const data = await res.json();
        const pathIds = extractPathIds(data.svg);
        setSvgContent(data.svg, pathIds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SVG読み込み失敗');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gemini API で漢字データ（字源・語彙・部品）を自動生成
   * SVGのパスマッピングは不要 — 純粋なデータ生成として動作
   */
  const handleGeminiGenerate = async () => {
    if (!kanji) return;
    setLoading(true);
    setError(null);
    try {
      const partNames = parts.length > 0 ? parts.map((p) => p.name) : undefined;
      const result = await generateKanjiData(kanji, grade, partNames);

      // 字源・語彙データをストアに反映
      setEtymology(result.etymology);
      setVocabularies(result.vocabularies);

      // 部品データが空の場合、Geminiの生成結果から部品を設定
      if (parts.length === 0 && result.writingLayer.length > 0) {
        setParts(result.writingLayer.map((w) => w.name));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gemini APIエラー');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const store = useAnnotationStore.getState();
    const json = store.exportJson();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kanji || 'kanji'}-hybrid.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** メインアプリに追加するための完全なJSONをクリップボードにコピー */
  const handleCopyForApp = () => {
    const store = useAnnotationStore.getState();
    const json = store.exportJson();
    navigator.clipboard.writeText(JSON.stringify(json, null, 2))
      .then(() => {
        setError(null);
        // 一時的にUIで成功を示す
        const el = document.getElementById('copy-feedback');
        if (el) {
          el.textContent = '✅ コピーしました！';
          setTimeout(() => { el.textContent = ''; }, 2000);
        }
      })
      .catch(() => setError('クリップボードへのコピーに失敗しました'));
  };

  const hasApiKey = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <h2 className="text-lg font-bold text-[var(--color-accent)] tracking-wide">
        入力・制御
      </h2>

      {/* APIキー警告 */}
      {!hasApiKey && (
        <div className="bg-amber-500/10 border border-amber-500 rounded-lg p-2 text-xs text-amber-400">
          ⚠️ VITE_GEMINI_API_KEY が未設定です。<br />
          <code className="text-[10px]">apps/tool/.env</code> にキーを追加してください。
        </div>
      )}

      {/* 漢字入力 */}
      <div className="space-y-1">
        <label className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
          対象漢字
        </label>
        <input
          type="text"
          value={kanji}
          onChange={(e) => setKanji(e.target.value)}
          placeholder="例: 遊"
          maxLength={1}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2
                     text-4xl text-center text-[var(--color-text)]
                     focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]
                     transition-all"
        />
      </div>

      {/* 学年 */}
      <div className="space-y-1">
        <label className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
          学年
        </label>
        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2
                     text-[var(--color-text)]
                     focus:outline-none focus:border-[var(--color-accent)]"
        >
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>{g}年生</option>
          ))}
        </select>
      </div>

      {/* 部品入力 */}
      <div className="space-y-1">
        <label className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
          部品名（カンマ区切り・省略可）
        </label>
        <textarea
          value={parts.map((p) => p.name).join('、')}
          onChange={(e) => handlePartsInput(e.target.value)}
          placeholder="例: 方,𠂉,子,辶 &#10;空欄ならGeminiが自動推定します"
          rows={3}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2
                     text-[var(--color-text)] text-lg
                     focus:outline-none focus:border-[var(--color-accent)]
                     resize-none"
        />
      </div>

      {/* 部品パレット */}
      {parts.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs text-[var(--color-text-dim)] uppercase tracking-wider">
            部品パレット
          </label>
          <PartPalette />
        </div>
      )}

      {/* エラー */}
      {error && (
        <div className="bg-[var(--color-danger)]/10 border border-[var(--color-danger)] rounded-lg p-2 text-sm text-[var(--color-danger)] animate-fade-in">
          {error}
        </div>
      )}

      {/* ボタン群 */}
      <div className="flex flex-col gap-2 mt-auto">
        <button
          onClick={handleLoadSvg}
          disabled={!kanji || isLoading}
          className="w-full py-2.5 rounded-lg font-medium text-sm
                     bg-[var(--color-surface-3)] text-[var(--color-text)]
                     hover:bg-[var(--color-border)] disabled:opacity-40
                     transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          📝 SVG読み込み
        </button>
        <button
          onClick={handleGeminiGenerate}
          disabled={!kanji || !hasApiKey || isLoading}
          className="w-full py-2.5 rounded-lg font-medium text-sm
                     bg-[var(--color-accent)] text-white
                     hover:bg-[var(--color-accent-glow)] disabled:opacity-40
                     transition-all cursor-pointer disabled:cursor-not-allowed
                     animate-pulse-glow"
        >
          {isLoading ? '⏳ 生成中...' : '🤖 Gemini データ生成'}
        </button>

        <hr className="border-[var(--color-border)]" />

        <button
          onClick={handleExport}
          disabled={!kanji}
          className="w-full py-2.5 rounded-lg font-medium text-sm
                     bg-[var(--color-success)] text-[var(--color-surface)]
                     hover:brightness-110 disabled:opacity-40
                     transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          📦 JSONファイル保存
        </button>
        <button
          onClick={handleCopyForApp}
          disabled={!kanji}
          className="w-full py-2 rounded-lg font-medium text-sm
                     bg-[var(--color-surface-3)] text-[var(--color-text)]
                     border border-[var(--color-border)]
                     hover:bg-[var(--color-border)] disabled:opacity-40
                     transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          📋 JSONをクリップボードにコピー
        </button>
        <span id="copy-feedback" className="text-xs text-center text-[var(--color-success)]" />
      </div>
    </div>
  );
}

/** 部品パレット: クリックで activePartId を切り替え */
function PartPalette() {
  const { parts, activePartId, setActivePartId, pathAssignments } = useAnnotationStore();

  return (
    <div className="flex flex-wrap gap-1.5">
      {parts.map((part) => {
        const isActive = activePartId === part.id;
        const assignedCount = Object.values(pathAssignments).filter((v) => v === part.id).length;
        return (
          <button
            key={part.id}
            onClick={() => setActivePartId(part.id)}
            className={`px-2.5 py-1 rounded-md text-sm font-medium transition-all cursor-pointer
                        border-2 ${isActive
                ? 'border-white shadow-lg scale-105'
                : 'border-transparent hover:border-white/30'
              }`}
            style={{ backgroundColor: part.color + '30', color: part.color, borderColor: isActive ? part.color : undefined }}
          >
            {part.name}
            {assignedCount > 0 && (
              <span className="ml-1 text-xs opacity-70">({assignedCount})</span>
            )}
          </button>
        );
      })}
      {/* 未割当表示 */}
      <div className="flex items-center gap-1 px-2 text-xs" style={{ color: UNASSIGNED_COLOR }}>
        <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: UNASSIGNED_COLOR }} />
        未割当
      </div>
    </div>
  );
}

/** SVGテキストからpath要素のIDを抽出 */
function extractPathIds(svgText: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const paths = doc.querySelectorAll('path[id]');
  return Array.from(paths).map((el) => el.getAttribute('id')!).filter(Boolean);
}
