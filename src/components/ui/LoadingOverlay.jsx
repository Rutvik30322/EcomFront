import React from 'react';
import styles from './LoadingOverlay.module.css';

/**
 * LoadingOverlay — used only on Edit/form pages for save/upload actions.
 * Shows a slim animated bar at the top + a small floating status pill.
 * No more full-screen blocking overlay.
 */
const LoadingOverlay = ({ message = 'Loading...', show = false }) => {
  if (!show) return null;

  return (
    <>
      {/* Slim animated top bar */}
      <div className={styles.progressBar} />
      {/* Floating status pill */}
      <div className={styles.statusPill}>
        <span className={styles.dot} />
        {message}
      </div>
    </>
  );
};

export default LoadingOverlay;
