import { useEffect, useRef, useCallback } from 'react';
import { useAnnotationStore, UNASSIGNED_COLOR } from '../store/annotationStore';

/**
 * 中央ペイン: KanjiVG SVG描画 + パスクリックによる部品アサイン
 */
export function SvgCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { svgContent, pathAssignments, parts, assignPath, unassignPath } =
    useAnnotationStore();

  const partColorMap = new Map(parts.map((p) => [p.id, p.color]));

  const getPathColor = useCallback(
    (pathId: string): string => {
      const partId = pathAssignments[pathId];
      if (!partId) return UNASSIGNED_COLOR;
      return partColorMap.get(partId) ?? UNASSIGNED_COLOR;
    },
    [pathAssignments, partColorMap]
  );

  // SVG を DOM に挿入し、イベントをバインド
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    container.innerHTML = svgContent;
    const svg = container.querySelector('svg');
    if (!svg) return;

    // SVG のビューボックス設定
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.maxWidth = '100%';
    svg.style.maxHeight = '100%';

    // 全 path 要素にスタイルとイベントを適用
    const paths = svg.querySelectorAll('path[id]');
    paths.forEach((pathEl) => {
      const el = pathEl as SVGPathElement;
      const pathId = el.getAttribute('id')!;

      // 初期スタイル
      applyPathStyle(el, getPathColor(pathId));

      // クリックイベント: アクティブ部品をアサイン / 右クリックで解除
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const store = useAnnotationStore.getState();
        if (store.activePartId) {
          // 同じ部品が既にアサインされている場合は解除
          if (store.pathAssignments[pathId] === store.activePartId) {
            unassignPath(pathId);
          } else {
            assignPath(pathId);
          }
        }
      });

      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        unassignPath(pathId);
      });
    });

    return () => {
      container.innerHTML = '';
    };
  }, [svgContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // pathAssignments が変わったら色を更新
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const paths = container.querySelectorAll('path[id]');
    paths.forEach((pathEl) => {
      const el = pathEl as SVGPathElement;
      const pathId = el.getAttribute('id')!;
      applyPathStyle(el, getPathColor(pathId));
    });
  }, [pathAssignments, getPathColor]);

  // 統計
  const totalPaths = Object.keys(pathAssignments).length;
  const assignedPaths = Object.values(pathAssignments).filter((v) => v !== null).length;
  const unassignedPaths = totalPaths - assignedPaths;

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
        <h2 className="text-lg font-bold text-[var(--color-accent)]">
          形態マッピング
        </h2>
        {totalPaths > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[var(--color-success)]">✓ {assignedPaths}</span>
            <span>/</span>
            <span>{totalPaths} パス</span>
            {unassignedPaths > 0 && (
              <span className="text-[var(--color-danger)] font-bold animate-pulse">
                ⚠ {unassignedPaths} 未割当
              </span>
            )}
          </div>
        )}
      </div>

      {/* SVGキャンバス */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        {svgContent ? (
          <div
            ref={containerRef}
            className="svg-canvas-container w-full h-full flex items-center justify-center"
          />
        ) : (
          <div className="text-center text-[var(--color-text-dim)] space-y-3">
            <div className="text-6xl opacity-30">漢</div>
            <p className="text-sm">
              左ペインで漢字を入力し<br />
              「SVG読み込み」を実行してください
            </p>
          </div>
        )}
      </div>

      {/* ヒント */}
      {svgContent && (
        <div className="px-4 py-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-dim)]">
          💡 左クリック: 選択中の部品をアサイン ・ 右クリック: 割り当て解除
        </div>
      )}
    </div>
  );
}

function applyPathStyle(el: SVGPathElement, color: string) {
  el.style.fill = 'none';
  el.style.stroke = color;
  el.style.strokeWidth = '4';
}
