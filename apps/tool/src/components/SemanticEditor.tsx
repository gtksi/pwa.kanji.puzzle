import { useAnnotationStore } from '../store/annotationStore';

/**
 * 右ペイン: 字源解説エディタ + 語彙ネットワークエディタ
 */
export function SemanticEditor() {
  const {
    etymology, setEtymology,
    vocabularies, updateVocabulary, addVocabulary, removeVocabulary,
  } = useAnnotationStore();

  return (
    <div className="flex flex-col h-full p-4 gap-5 overflow-y-auto">
      <h2 className="text-lg font-bold text-[var(--color-accent)] tracking-wide">
        意味レイヤー
      </h2>

      {/* 部首情報 */}
      <section className="space-y-2 animate-fade-in">
        <h3 className="text-sm font-semibold text-[var(--color-text-dim)] uppercase tracking-wider">
          部首・字源
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <FieldInput
            label="部首"
            value={etymology.traditionalRadical ?? ''}
            onChange={(v) => setEtymology({ traditionalRadical: v })}
            placeholder="例: ⻌"
          />
          <FieldInput
            label="部首名"
            value={etymology.radicalName ?? ''}
            onChange={(v) => setEtymology({ radicalName: v })}
            placeholder="例: しんにょう"
          />
        </div>
        <FieldInput
          label="部首の意味"
          value={etymology.radicalMeaning ?? ''}
          onChange={(v) => setEtymology({ radicalMeaning: v })}
          placeholder="例: 歩く・進む"
        />
      </section>

      {/* 字源解説 */}
      <section className="space-y-2 animate-fade-in">
        <h3 className="text-sm font-semibold text-[var(--color-text-dim)] uppercase tracking-wider">
          字源解説（11〜12歳向け）
        </h3>
        <textarea
          value={etymology.originDescription ?? ''}
          onChange={(e) => setEtymology({ originDescription: e.target.value })}
          placeholder="『説文解字』ベースの字源を記入..."
          rows={5}
          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2
                     text-[var(--color-text)] text-sm leading-relaxed
                     focus:outline-none focus:border-[var(--color-accent)]
                     resize-none"
        />
      </section>

      {/* 同義語・反義語 */}
      <section className="space-y-2 animate-fade-in">
        <h3 className="text-sm font-semibold text-[var(--color-text-dim)] uppercase tracking-wider">
          同義語・反義語
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <FieldInput
            label="同義語（カンマ区切り）"
            value={(etymology.synonyms ?? []).join('、')}
            onChange={(v) => setEtymology({ synonyms: v.split(/[,、]/).map((s) => s.trim()).filter(Boolean) })}
            placeholder="例: 遊戯、戯れ"
          />
          <FieldInput
            label="反義語（カンマ区切り）"
            value={(etymology.antonyms ?? []).join('、')}
            onChange={(v) => setEtymology({ antonyms: v.split(/[,、]/).map((s) => s.trim()).filter(Boolean) })}
            placeholder="例: 勤勉、努力"
          />
        </div>
      </section>

      {/* 語彙ネットワーク */}
      <section className="space-y-2 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text-dim)] uppercase tracking-wider">
            語彙ネットワーク
          </h3>
          <button
            onClick={addVocabulary}
            className="text-xs px-2 py-1 rounded-md bg-[var(--color-accent)] text-white
                       hover:bg-[var(--color-accent-glow)] transition-colors cursor-pointer"
          >
            + 追加
          </button>
        </div>

        {vocabularies.length === 0 && (
          <p className="text-xs text-[var(--color-text-dim)] italic">
            語彙がありません。「+ 追加」で語彙を追加してください。
          </p>
        )}

        <div className="space-y-3">
          {vocabularies.map((vocab, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-dim)]">語彙 {i + 1}</span>
                <button
                  onClick={() => removeVocabulary(i)}
                  className="text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)]/80
                             cursor-pointer transition-colors"
                >
                  ✕ 削除
                </button>
              </div>
              <FieldInput
                label="熟語"
                value={vocab.word}
                onChange={(v) => updateVocabulary(i, { ...vocab, word: v })}
                placeholder="例: 遊泳"
              />
              <FieldInput
                label="意味"
                value={vocab.meaning}
                onChange={(v) => updateVocabulary(i, { ...vocab, meaning: v })}
                placeholder="例: （プールや海で）泳いで遊ぶこと"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** 共通の input フィールド */
function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-0.5">
      <label className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2.5 py-1.5
                   text-[var(--color-text)] text-sm
                   focus:outline-none focus:border-[var(--color-accent)]
                   transition-colors"
      />
    </div>
  );
}
