import React from 'react';
import styles from './Skeleton.module.css';

/**
 * SkeletonStatCard — shows a shimmer placeholder for dashboard stat cards
 */
export const SkeletonStatCard = () => (
  <div className={styles.skeletonCard}>
    <div className={`${styles.skeleton} ${styles.skeletonCircle}`} />
    <div className={styles.skeletonCardBody}>
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeleton} ${styles.skeletonSubtitle}`} />
    </div>
  </div>
);

/**
 * SkeletonRow — a shimmer table row
 */
export const SkeletonRow = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${styles.skeletonLight} ${styles.skeletonRow}`} />
    ))}
  </>
);

/**
 * SkeletonText — shimmer text lines
 */
export const SkeletonText = ({ lines = 3 }) => (
  <div>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`${styles.skeletonLight} ${styles.skeletonLine} ${
          i % 3 === 0 ? styles.skeletonLineFull :
          i % 3 === 1 ? styles.skeletonLineMed :
          styles.skeletonLineShort
        }`}
      />
    ))}
  </div>
);

export default { SkeletonStatCard, SkeletonRow, SkeletonText };
