import React from 'react';
import Lottie from 'lottie-react';
import styles from './LoadingOverlay.module.css';
import loadingAnimation from '../../assets/loading_gray.json';

const LoadingOverlay = ({ message = 'Loading...', show = false }) => {
  if (!show) return null;

  return (
    <div className={styles.loadingOverlay}>
      <div className={styles.loadingSpinner}>
        <Lottie
          animationData={loadingAnimation}
          loop
          autoplay
          style={{ width: 50, height: 50 }}
        />
        <p className={styles.loadingText}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
