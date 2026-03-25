# pwa.kanji.puzzle
小学生の漢字暗記アプリ（ミチムラ式漢字学習法ベース）

## プロジェクト状況
- **全学年漢字データ生成完了**: 1年生〜6年生の教育漢字（計1,026文字）の学習データ（部品構成、字源、語彙）をGemini APIにより生成済み。
- **データ場所**: `apps/main/src/data/kanji-data.json`
- **生成スクリプト**: `generate_kanji_batch_v3.mjs`
