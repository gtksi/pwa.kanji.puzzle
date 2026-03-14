import { InputPane } from './components/InputPane';
import { SvgCanvas } from './components/SvgCanvas';
import { SemanticEditor } from './components/SemanticEditor';
import './index.css';

function App() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔬</span>
          <h1 className="text-base font-bold tracking-wide text-[var(--color-text)]">
            KanjiVG・漢字クエスト アノテーションツール
          </h1>
        </div>
        <span className="text-xs text-[var(--color-text-dim)]">v0.1.0</span>
      </header>

      {/* 3ペインレイアウト */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左ペイン: 入力・制御 */}
        <aside className="w-72 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-y-auto">
          <InputPane />
        </aside>

        {/* 中央ペイン: SVGキャンバス */}
        <main className="flex-1 bg-[var(--color-surface)] overflow-hidden">
          <SvgCanvas />
        </main>

        {/* 右ペイン: 意味レイヤーエディタ */}
        <aside className="w-80 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-hidden">
          <SemanticEditor />
        </aside>
      </div>
    </div>
  );
}

export default App;
