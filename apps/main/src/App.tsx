import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TechTree } from './pages/TechTree';
import { FormLearning } from './pages/FormLearning';
import { RecallLearning } from './pages/Recall';
import { MeaningLearning } from './pages/MeaningLearning';
import { useGameStore } from './store/gameStore';
import './index.css';

function App() {
  const initProgress = useGameStore((state) => state.initProgress);

  useEffect(() => {
    initProgress();
  }, [initProgress]);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="page-container">
        {/* ヘッダー */}
        <header className="app-header">
          <div className="app-header__title">
            <span className="app-header__logo">🧩</span>
            <span>漢字パズル</span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
            漢字クエスト
          </span>
        </header>

        {/* ルーティング */}
        <Routes>
          <Route path="/" element={<TechTree />} />
          <Route path="/learn/:kanjiId" element={<FormLearning />} />
          <Route path="/recall/:kanjiId" element={<RecallLearning />} />
          <Route path="/meaning/:kanjiId" element={<MeaningLearning />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
