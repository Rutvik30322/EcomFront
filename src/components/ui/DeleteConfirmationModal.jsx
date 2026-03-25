import React from 'react';
import styles from './DeleteConfirmationModal.module.css';

const DeleteConfirmationModal = ({
  show = false,
  title = 'Delete Item',
  message = 'Are you sure you want to delete this item?',
  itemName = '',
  itemDetails = [],
  onConfirm,
  onCancel,
  loading = false,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}) => {
  if (!show) return null;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button
            className={styles.modalCloseBtn}
            onClick={onCancel}
            disabled={loading}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.modalMessage}>{message}</p>
          {itemName && (
            <p className={styles.modalInfo}>
              <strong>Name:</strong> {itemName}
            </p>
          )}
          {itemDetails.map((detail, index) => (
            <p key={index} className={styles.modalInfo}>
              <strong>{detail.label}:</strong> {detail.value}
            </p>
          ))}
          <p className={styles.warningText}>
            ⚠️ This action cannot be undone!
          </p>
        </div>
        <div className={styles.modalActions}>
          <button
            className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span> Deleting...
              </>
            ) : (
              confirmText
            )}
          </button>
          <button
            className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
