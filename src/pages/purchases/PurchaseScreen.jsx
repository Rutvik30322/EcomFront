import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import Button from '../../components/ui/Button';
import styles from './Purchase.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPurchase, deletepurchases } from '../../store/slices/purchaseSlice';
import editIcon from "../../assets/svg/edit.svg";
import deleteIcon from "../../assets/svg/delete.svg";
import addIcon from "../../assets/svg/add.svg";
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 10;

const Purchase = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, purchaseNo }
  const { items: purchases, loading, error, pagination } = useSelector(state => state.purchases);

  useEffect(() => {
    dispatch(fetchPurchase({ page: currentPage, limit: ITEMS_PER_PAGE }));
  }, [dispatch, currentPage]);

  const totalPages = pagination?.pages || 1;
  const totalItems = pagination?.total || 0;

  const handleDelete = (id, purchaseNo) => {
    setDeleteTarget({ id, purchaseNo });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deletepurchases(deleteTarget.id));
    setDeleteTarget(null);
    const newPage = purchases.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
    setCurrentPage(newPage);
    dispatch(fetchPurchase({ page: newPage, limit: ITEMS_PER_PAGE }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <>
      <PageLayout
        title={t("Purchase Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading}
        loadingMessage={t("Loading purchases...")}
      >
        <RefreshBanner show={loading && purchases.length > 0} label="purchases" />

        <div className={styles.productsHeader}>
          <h2 className={styles.productsTitle}>
            {t('All Purchases')}
            {totalItems > 0 && (
              <span style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 400, marginLeft: '0.75rem' }}>
                ({totalItems} {t('total')})
              </span>
            )}
          </h2>
          <Button leftIcon={<img src={addIcon} alt="" width="22" />}
            onClick={() => navigate('/purchaseScreen/add')}>
            {t('Add Purchase')}
          </Button>
        </div>

        {error && (
          <div style={{ textAlign: 'center', padding: '1rem', color: '#ef4444', background: '#fef2f2', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>{t('Sr No')}</th>
                <th className={styles.th}>{t('Purchase No')}</th>
                <th className={styles.th}>{t('Supplier Name')}</th>
                <th className={styles.th}>{t('Invoice Date')}</th>
                <th className={styles.th}>{t('Invoice No')}</th>
                <th className={styles.th}>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {!loading && purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    {t('No purchases found.')}
                  </td>
                </tr>
              ) : (
                purchases.map((purchase, index) => (
                  <tr key={purchase._id}>
                    <td className={styles.td}>
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className={styles.td}>{purchase.purchaseNo}</td>
                    <td className={styles.td}>{purchase.supplierName}</td>
                    <td className={styles.td}>
                      {new Date(purchase.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className={styles.td}>{purchase.invoiceNo}</td>
                    <td className={styles.actionsCell}>
                      <button
                        className={styles.editBtn}
                        onClick={() => navigate(`/purchaseScreen/edit/${purchase._id}`)}
                      >
                        <img src={editIcon} alt="Edit" width="25" />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(purchase._id, purchase.purchaseNo)}>
                        <img src={deleteIcon} alt="Delete" width="25" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          pagination={{ page: currentPage, pages: totalPages, total: totalItems }}
          onPageChange={handlePageChange}
          loading={loading}
          className={styles.paginationContainer}
          btnClassName={styles.paginationBtn}
          infoClassName={styles.paginationInfo}
          showTotal={false}
        />
      </PageLayout>

      { }
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem 2.5rem',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            textAlign: 'center',
          }}>
            { }
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#fef2f2', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                <path stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
              </svg>
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: '#111827', fontWeight: 700 }}>
              {t('Delete Purchase')}
            </h3>
            <p style={{ margin: '0 0 1.75rem', color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.5 }}>
              {t('Are you sure you want to delete purchase')}{' '}
              <strong style={{ color: '#111827' }}>#{deleteTarget.purchaseNo}</strong>?{' '}
              {t('This action cannot be undone.')}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{
                  flex: 1, padding: '0.65rem 1.25rem',
                  border: '1.5px solid #d1d5db', borderRadius: '8px',
                  background: '#fff', color: '#374151',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.target.style.background = '#f3f4f6'}
                onMouseLeave={e => e.target.style.background = '#fff'}
              >
                {t('Cancel')}
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, padding: '0.65rem 1.25rem',
                  border: 'none', borderRadius: '8px',
                  background: '#dc2626', color: '#fff',
                  fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.target.style.background = '#b91c1c'}
                onMouseLeave={e => e.target.style.background = '#dc2626'}
              >
                {t('Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Purchase;
