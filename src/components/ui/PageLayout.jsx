import React, { useRef } from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import dashboardStyles from '../../pages/dashboard/Dashboard.module.css';

/* ── Shimmer keyframe injected once ─────────────────────────── */
const shimmerStyle = `
@keyframes _skel_shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
._skel_row {
  height: 54px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #f0f4ff 25%, #e2e8f0 50%, #f0f4ff 75%);
  background-size: 600px 100%;
  animation: _skel_shimmer 1.4s ease-in-out infinite;
}
._skel_hdr {
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f4ff 25%, #e2e8f0 50%, #f0f4ff 75%);
  background-size: 600px 100%;
  animation: _skel_shimmer 1.4s ease-in-out infinite;
}
._skel_progress {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 3px;
  background: linear-gradient(90deg, #0EA5E9 0%, #38BDF8 50%, #0EA5E9 100%);
  background-size: 200% 100%;
  animation: _skel_shimmer 1s ease-in-out infinite;
}
`;

/** Skeleton table placeholder */
const TableSkeleton = ({ rows = 9 }) => (
  <div style={{ padding: '0 0.25rem' }}>
    {/* Fake header row */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
      <div className="_skel_hdr" style={{ width: 180 }} />
      <div className="_skel_hdr" style={{ width: 130 }} />
    </div>
    {/* Fake filter row */}
    <div style={{ display: 'flex', gap: 12, marginBottom: '1.25rem' }}>
      {[200, 150, 150].map((w, i) => (
        <div key={i} className="_skel_hdr" style={{ width: w, height: 36 }} />
      ))}
    </div>
    {/* Skeleton table header */}
    <div className="_skel_hdr" style={{ height: 42, marginBottom: 10, opacity: 0.6 }} />
    {/* Skeleton data rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="_skel_row" style={{ opacity: Math.max(0.3, 1 - i * 0.08) }} />
    ))}
  </div>
);

/**
 * PageLayout — wraps every list/detail page.
 *
 * Behaviour:
 *  • First load (items array empty + loading) → shows shimmer skeleton rows
 *  • Subsequent loads (items already visible + loading) → thin animated top bar
 *  • No loading → renders children normally
 *
 * Props:
 *   title           {string}
 *   sidebarOpen     {boolean}
 *   setSidebarOpen  {function}
 *   loading         {boolean}
 *   loadingMessage  {string}   kept for API compat, unused visually
 *   children        {ReactNode}
 *   skeletonRows    {number}   default 9
 */
const PageLayout = ({
  title,
  sidebarOpen,
  setSidebarOpen,
  loading = false,
  loadingMessage = 'Loading...',
  children,
  skeletonRows = 9,
}) => {
  // Track whether real data has been rendered at least once
  const hasRenderedData = useRef(false);
  if (!loading) hasRenderedData.current = true;

  // First-time loading (no data yet) → full skeleton
  const isFirstLoad = loading && !hasRenderedData.current;

  return (
    <div className={dashboardStyles.dashboardContainer}>
      <style>{shimmerStyle}</style>

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main
        className={`${dashboardStyles.mainContent} ${!sidebarOpen ? dashboardStyles.mainContentExpanded : ''}`}
      >
        <Header title={title} onMenuToggle={() => setSidebarOpen(o => !o)} />

        {/* Slim animated progress bar when refreshing existing data */}
        {loading && !isFirstLoad && (
          <div className="_skel_progress" />
        )}

        <div className={dashboardStyles.dashboardContent}>
          {isFirstLoad ? (
            <TableSkeleton rows={skeletonRows} />
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
