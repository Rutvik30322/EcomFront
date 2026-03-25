import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchReviews, approveReview, deleteReview, clearError, setFilter } from '../../store/slices/reviewSlice';
import { useSocket } from '../../contexts/SocketContext';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import Dropdown from '../../components/ui/Dropdown';
import styles from './Reviews.module.css';
import { useTranslation } from 'react-i18next';

const Reviews = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: reviews, loading, error, pagination, filters } = useSelector(state => state.reviews);
  const { onDataUpdate } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [approvedFilter, setApprovedFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    approve: false,
    delete: false,
    pagination: false,
  });


  useEffect(() => {
    const loadReviews = async () => {
      try {
        // When "All Reviews" is selected (empty string), pass undefined to fetch all
        const approvedParam = approvedFilter === '' ? undefined : approvedFilter === 'true';
        await dispatch(fetchReviews({ product: filters.product, approved: approvedParam, page: 1 })).unwrap();
      } catch (error) {
        // If it's a duplicate request error, retry after a short delay
        if (error === 'Duplicate request prevented' || error?.includes?.('Duplicate request prevented')) {
          setTimeout(() => {
            const approvedParam = approvedFilter === '' ? undefined : approvedFilter === 'true';
            dispatch(fetchReviews({ product: filters.product, approved: approvedParam, page: 1 }));
          }, 500);
        }
      }
    };

    loadReviews();
  }, [dispatch, approvedFilter, filters.product]);

  // Listen for real-time review updates
  useEffect(() => {
    if (!onDataUpdate) return;

    const unsubscribe = onDataUpdate('reviews', (action, payload) => {
      // Refresh reviews list when data changes
      const approvedParam = approvedFilter === '' ? undefined : approvedFilter === 'true';
      dispatch(fetchReviews({ product: filters.product, approved: approvedParam, page: 1 }));
    });

    return unsubscribe;
  }, [onDataUpdate, dispatch, approvedFilter, filters.product]);

  const handleApproveChange = (e) => {
    setApprovedFilter(e.target.value);
    dispatch(setFilter({ approved: e.target.value }));
  };

  const handleApprove = async (reviewId, isApproved) => {
    try {
      setActionLoading(prev => ({ ...prev, approve: true }));
      await dispatch(approveReview({ id: reviewId, isApproved }));
      const approvedParam = approvedFilter === '' ? undefined : approvedFilter === 'true';
      await dispatch(fetchReviews({ product: filters.product, approved: approvedParam, page: filters.page }));
    } catch (error) {
      console.error('Error approving review:', error);
      alert('Failed to update review: ' + (error?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, approve: false }));
    }
  };

  const handleDelete = (review) => {
    setReviewToDelete(review);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (reviewToDelete) {
      try {
        setActionLoading(prev => ({ ...prev, delete: true }));
        await dispatch(deleteReview(reviewToDelete._id));
        const approvedParam = approvedFilter === '' ? undefined : approvedFilter === 'true';
        await dispatch(fetchReviews({ product: filters.product, approved: approvedParam, page: filters.page }));
        setShowDeleteModal(false);
        setReviewToDelete(null);
      } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review: ' + (error?.message || 'Unknown error'));
      } finally {
        setActionLoading(prev => ({ ...prev, delete: false }));
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setReviewToDelete(null);
  };

  const handlePageChange = async (newPage) => {
    if (!pagination || newPage < 1 || newPage > pagination.pages) return;
    setActionLoading(prev => ({ ...prev, pagination: true }));
    try {
      const approvedParam = approvedFilter === '' ? undefined : approvedFilter === 'true';
      await dispatch(fetchReviews({ product: filters.product, approved: approvedParam, page: newPage }));
    } finally {
      setActionLoading(prev => ({ ...prev, pagination: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // if (loading && reviews.length === 0) {
  //   return (
  //     <div className={dashboardStyles.dashboardContainer}>
  //     <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
  //       Loading reviews...
  //     </div>
  //   </div>
  //   );
  // }

  return (
    <>
      <PageLayout
        title={t("Review Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.approve || actionLoading.delete || actionLoading.pagination}
        loadingMessage={
          actionLoading.approve ? t('Updating review...') :
            actionLoading.delete ? t('Deleting review...') :
              actionLoading.pagination ? t('Loading page...') : t('Loading reviews...')
        }
      >
        <RefreshBanner show={loading && reviews.length > 0} label="reviews" />
        {error && error !== 'Duplicate request prevented' && !error.includes('Duplicate request prevented') && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => dispatch(clearError())} aria-label="Close error">✕</button>
          </div>
        )}

        <div className={styles.reviewsHeader}>
          <h2 className={styles.reviewsTitle}>{t('All Reviews')}</h2>
        </div>

        {/* Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <Dropdown
              value={approvedFilter}
              onChange={handleApproveChange}
              placeholder={t("All Reviews")}
              options={[
                { value: 'true', label: t('Approved') },
                { value: 'false', label: t('Pending') },
              ]}
            />
          </div>
        </div>

        {Array.isArray(reviews) && reviews.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>
              {t('No reviews found.')}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>{t('Sr No')}</th>
                    <th className={styles.th}>{t('Product')}</th>
                    <th className={styles.th}>{t('User')}</th>
                    <th className={styles.th}>{t('Rating')}</th>
                    <th className={styles.th}>{t('Comment')}</th>
                    <th className={styles.th}>{t('Date')}</th>
                    <th className={styles.th}>{t('Status')}</th>
                    <th className={styles.th}>{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(reviews) && reviews.map((review, index) => {
                    const productName = (review.product && typeof review.product === 'object')
                      ? review.product.name
                      : t('N/A');
                    const userName = (review.user && typeof review.user === 'object')
                      ? review.user.name
                      : t('Anonymous');
                    const userEmail = (review.user && typeof review.user === 'object' && review.user.email)
                      ? review.user.email
                      : null;

                    return (
                      <tr key={review._id}>
                        <td className={styles.td}>{(pagination?.page - 1) * (pagination?.limit || 10) + index + 1}</td>
                        <td className={styles.td}>
                          <div className={styles.productName}>{productName}</div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.userInfo}>
                            <div className={styles.userName}>{userName}</div>
                            {userEmail && (
                              <div className={styles.userEmail}>{userEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.ratingDisplay}>
                            <span className={styles.stars}>
                              {renderStars(review.rating)}
                            </span>
                            <span className={styles.ratingValue}>
                              ({review.rating}/5)
                            </span>
                          </div>
                        </td>
                        <td className={`${styles.td} ${styles.commentCell}`} title={review.comment || t('No comment')}>
                          {review.comment || <span className={styles.commentEmpty}>{t('No comment')}</span>}
                        </td>
                        <td className={`${styles.td} ${styles.dateCell}`}>
                          {formatDate(review.createdAt)}
                        </td>
                        <td className={styles.td}>
                          <span className={`${styles.statusBadge} ${review.isApproved ? styles.statusApproved : styles.statusPending}`}>
                            {review.isApproved ? t('✓ Approved') : t('⏳ Pending')}
                          </span>
                        </td>
                        <td className={styles.actionsCell}>
                          {!review.isApproved ? (
                            <button
                              className={`${styles.actionBtn} ${styles.approveBtn}`}
                              onClick={() => handleApprove(review._id, true)}
                              disabled={loading || actionLoading.approve || actionLoading.delete}
                            >
                              {actionLoading.approve ? t('Updating...') : t('Approve')}
                            </button>
                          ) : (
                            <button
                              className={`${styles.actionBtn} ${styles.rejectBtn}`}
                              onClick={() => handleApprove(review._id, false)}
                              disabled={loading || actionLoading.approve || actionLoading.delete}
                            >
                              {actionLoading.approve ? t('Updating...') : t('Reject')}
                            </button>
                          )}
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={() => handleDelete(review)}
                            disabled={loading || actionLoading.approve || actionLoading.delete}
                          >
                            {t('Delete')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading || actionLoading.pagination}
              className={styles.paginationContainer}
              btnClassName={styles.paginationBtn}
              infoClassName={styles.paginationInfo}
            />
          </>
        )}
      </PageLayout>


      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        title={t("Delete Review")}
        message={t("Are you sure you want to delete this review?")}
        itemName={reviewToDelete ? (reviewToDelete.product && typeof reviewToDelete.product === 'object' ? reviewToDelete.product.name : t('N/A')) : ''}
        itemDetails={reviewToDelete ? [
          { label: t('User'), value: (reviewToDelete.user && typeof reviewToDelete.user === 'object' ? reviewToDelete.user.name : t('Anonymous')) },
          { label: t('Rating'), value: `${reviewToDelete.rating}/5` },
          { label: t('Status'), value: reviewToDelete.isApproved ? t('Approved') : t('Pending') },
        ] : []}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={actionLoading.delete}
        confirmText={t("Delete Review")}
        cancelText={t("Cancel")}
      />
    </>
  );
};

export default Reviews;
