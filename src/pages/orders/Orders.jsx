import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders, updateOrderStatus, deleteOrder, clearError } from '../../store/slices/orderSlice';
import { orderService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import Dropdown from '../../components/ui/Dropdown';
import styles from './Orders.module.css';
import paidIcon from "../../assets/svg/CODpaid.svg";
import unpaidIcon from "../../assets/svg/CODunpaid.svg";
import deleteIcon from "../../assets/svg/delete.svg";
import viewIcon from "../../assets/svg/view.svg";
import statusIcon from "../../assets/svg/status.svg";
import { useTranslation } from 'react-i18next';
import CountdownTimer from '../../components/ui/CountdownTimer';

const Orders = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: orders, loading, error, pagination, filters } = useSelector(state => state.orders);
  const { onDataUpdate } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentAlertModal, setShowPaymentAlertModal] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    statusUpdate: false,
    paymentUpdate: false,
    delete: false,
    pagination: false,
  });

  useEffect(() => {

    const loadOrders = async () => {
      try {
        await dispatch(fetchOrders({ status: statusFilter, page: 1 })).unwrap();
      } catch (error) {

        if (error === 'Duplicate request prevented' || error?.includes?.('Duplicate request prevented')) {
          setTimeout(() => {
            dispatch(fetchOrders({ status: statusFilter, page: 1 }));
          }, 500);
        }
      }
    };

    loadOrders();
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (!onDataUpdate) return;

    const unsubscribe = onDataUpdate('orders', (action, payload) => {

      dispatch(fetchOrders({ status: statusFilter, page: 1 }));
    });

    return unsubscribe;
  }, [onDataUpdate, dispatch, statusFilter]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleUpdateStatus = (order) => {
    setEditingOrder(order);
    setShowStatusModal(true);
  };

  const confirmStatusUpdate = async (newStatus) => {
    if (editingOrder) {
      if (newStatus === 'Delivered' && !editingOrder.isPaid) {
        setShowPaymentAlertModal(true);
        setShowStatusModal(false);
        return;
      }

      try {
        setActionLoading(prev => ({ ...prev, statusUpdate: true }));
        await dispatch(updateOrderStatus({ id: editingOrder._id, orderStatus: newStatus }));
        setShowStatusModal(false);
        setEditingOrder(null);

        await dispatch(fetchOrders({ status: statusFilter, page: 1 }));
      } catch (error) {
        console.error('Error updating order status:', error);
        alert('Failed to update order status: ' + (error || 'Unknown error'));
      } finally {
        setActionLoading(prev => ({ ...prev, statusUpdate: false }));
      }
    }
  };

  const handleUpdatePayment = (order) => {
    setEditingOrder(order);
    setShowPaymentModal(true);
  };

  const confirmPaymentUpdate = async (isPaid) => {
    if (editingOrder) {
      try {
        setActionLoading(prev => ({ ...prev, paymentUpdate: true }));
        await orderService.updateOrderPayment(editingOrder._id, isPaid);
        setShowPaymentModal(false);
        setEditingOrder(null);

        await dispatch(fetchOrders({ status: statusFilter, page: 1 }));
      } catch (error) {

        if (error.message === 'Duplicate request prevented' || error.isRateLimit) {

          setTimeout(() => {
            dispatch(fetchOrders({ status: statusFilter, page: 1 }));
          }, 500);
          return;
        }

        const errorMessage = error.response?.data?.message || error.message;
        if (errorMessage !== 'Duplicate request prevented' && !error.isRateLimit) {
          console.error('Error updating payment status:', error);
          alert('Failed to update payment status: ' + errorMessage);
        }
      } finally {
        setActionLoading(prev => ({ ...prev, paymentUpdate: false }));
      }
    }
  };

  const handleViewOrder = (order) => {
    setViewingOrder(order);
  };

  const handleDeleteOrder = (order) => {
    setDeletingOrder(order);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = async () => {
    if (deletingOrder) {
      try {
        setActionLoading(prev => ({ ...prev, delete: true }));
        await dispatch(deleteOrder(deletingOrder._id)).unwrap();
        setShowDeleteModal(false);
        setDeletingOrder(null);

        await dispatch(fetchOrders({ status: statusFilter, page: 1 }));
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order: ' + (error || 'Unknown error'));
      } finally {
        setActionLoading(prev => ({ ...prev, delete: false }));
      }
    }
  };

  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setDeletingOrder(null);
  };

  const handlePageChange = async (newPage) => {
    if (!pagination || newPage < 1 || newPage > pagination.pages) return;
    setActionLoading(prev => ({ ...prev, pagination: true }));
    try {
      await dispatch(fetchOrders({ status: statusFilter, page: newPage }));
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
    });
  };

  const formatAmount = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <>
      <PageLayout
        title={t("Order Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.statusUpdate || actionLoading.paymentUpdate || actionLoading.delete}
        loadingMessage={
          actionLoading.statusUpdate ? t('Updating order status...') :
            actionLoading.paymentUpdate ? t('Updating payment status...') :
              actionLoading.delete ? t('Deleting order...') :
                t('Loading orders...')
        }
      >
        <RefreshBanner show={loading && orders.length > 0} label="orders" />

        {error && error !== 'Duplicate request prevented' && !error.includes('Duplicate request prevented') && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => dispatch(clearError())} aria-label="Close error">✕</button>
          </div>
        )}

        <div className={styles.ordersHeader}>
          <h2 className={styles.ordersTitle}>{t('All Orders')}</h2>
        </div>

        { }
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <Dropdown
              value={statusFilter}
              onChange={handleStatusChange}
              placeholder={t("All Status")}
              options={[
                { value: 'Pending', label: t('Pending') },
                { value: 'Processing', label: t('Processing') },
                { value: 'Shipped', label: t('Shipped') },
                { value: 'Delivered', label: t('Delivered') },
                { value: 'Cancelled', label: t('Cancelled') },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <Dropdown
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              placeholder={t("All Payments")}
              options={[
                { value: 'paid', label: t('Paid') },
                { value: 'unpaid', label: t('Unpaid') },
              ]}
            />
          </div>
        </div>

        {Array.isArray(orders) && orders.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>
              {t('No orders found.')}
            </p>
          </div>
        ) : (
          <>
            {loading && orders.length > 0 && (
              <div className={styles.tableLoadingIndicator}>
                <span className={styles.spinner}></span>
                <span>{t('Refreshing orders...')}</span>
              </div>
            )}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>{t('Sr No')}</th>
                    <th className={styles.th}>{t('Order ID')}</th>
                    <th className={styles.th}>{t('Customer')}</th>
                    <th className={styles.th}>{t('Date')}</th>
                    <th className={styles.th}>{t('Items')}</th>
                    <th className={styles.th}>{t('Amount')}</th>
                    <th className={styles.th}>{t('Payment')}</th>
                    <th className={styles.th}>{t('Status')}</th>
                    <th className={styles.th}>{t('Delivery Time')}</th>
                    <th className={styles.th}>{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(orders) && orders
                    .filter(order => {
                      if (paymentFilter === 'paid') return order.isPaid;
                      if (paymentFilter === 'unpaid') return !order.isPaid;
                      return true;
                    })
                    .map((order, index) => {
                      const customerName = order.user?.name || 'N/A';
                      const customerEmail = order.user?.email || '';
                      const statusClass = `status${order.orderStatus}`;

                      return (
                        <tr key={order._id}>
                          <td className={styles.td}>{(pagination?.page - 1) * (pagination?.limit || 10) + index + 1}</td>
                          <td className={styles.td}>
                            <span className={styles.orderId}>
                              #{order._id.slice(-8).toUpperCase()}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <div className={styles.customerInfo}>
                              <div className={styles.customerName}>{customerName}</div>
                              <div className={styles.customerEmail}>{customerEmail}</div>
                            </div>
                          </td>
                          <td className={`${styles.td} ${styles.dateCell}`}>
                            {formatDate(order.createdAt)}
                          </td>
                          <td className={`${styles.td} ${styles.itemsCell}`}>
                            {order.orderItems?.length || 0} {t('item(s)')}
                          </td>
                          <td className={`${styles.td} ${styles.amountCell}`}>
                            {formatAmount(order.totalPrice)}
                          </td>
                          <td className={styles.td}>
                            <div>
                              <button
                                className={`${styles.actionBtn} ${order.isPaid ? styles.paymentBtnUnpaid : styles.paymentBtn}`}
                                onClick={() => handleUpdatePayment(order)}
                                disabled={loading || actionLoading.statusUpdate || actionLoading.paymentUpdate || actionLoading.delete}
                              >

                                <img
                                  src={order.isPaid ? paidIcon : unpaidIcon} alt={order.isPaid ? t("Mark Unpaid") : t("Mark Paid")}
                                  width="30"
                                  height="30"
                                />
                              </button>
                              {order.paidAt && (
                                <div className={styles.paymentDate}>
                                  {t('Paid')}: {formatDate(order.paidAt)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={styles.td}>
                            <span className={`${styles.statusBadge} ${styles[statusClass]}`}>
                              {t(order.orderStatus)}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <CountdownTimer createdAt={order.createdAt} orderStatus={order.orderStatus} />
                          </td>
                          <td className={styles.actionsCell}>
                            <button
                              className={`${styles.actionBtn} ${styles.statusBtn}`}
                              onClick={() => handleUpdateStatus(order)}
                              disabled={loading || actionLoading.statusUpdate || actionLoading.paymentUpdate || actionLoading.delete}
                            >
                              <img src={statusIcon} alt="Status" width="25" />
                            </button>

                            <button
                              className={`${styles.actionBtn} ${styles.viewBtn}`}
                              onClick={() => handleViewOrder(order)}
                              disabled={loading || actionLoading.statusUpdate || actionLoading.paymentUpdate || actionLoading.delete}
                            >
                              <img src={viewIcon} alt="View" width="25" />

                            </button>
                            <button
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              onClick={() => handleDeleteOrder(order)}
                              disabled={loading || actionLoading.statusUpdate || actionLoading.paymentUpdate || actionLoading.delete}
                            >
                              <img src={deleteIcon} alt="Delete" width="25" />
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

      { }
      {showPaymentModal && editingOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('Update Payment Status')}</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => {
                  if (!actionLoading.paymentUpdate) {
                    setShowPaymentModal(false);
                    setEditingOrder(null);
                  }
                }}
                disabled={actionLoading.paymentUpdate}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalInfo}>
                Order #{editingOrder._id.slice(-8).toUpperCase()}
              </p>
              <p className={styles.modalInfo}>
                Amount: <strong>{formatAmount(editingOrder.totalPrice)}</strong>
              </p>
              <p className={styles.modalInfo}>
                {t('Current Status:')} <strong>{editingOrder.isPaid ? t('Paid') : t('Unpaid')}</strong>
              </p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnSuccess}`}
                onClick={() => confirmPaymentUpdate(true)}
                disabled={editingOrder.isPaid || actionLoading.paymentUpdate}
              >
                {actionLoading.paymentUpdate ? (
                  <>
                    <span className={styles.spinner}></span> {t('Updating...')}
                  </>
                ) : (
                  t('Mark as Paid')
                )}
              </button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
                onClick={() => confirmPaymentUpdate(false)}
                disabled={!editingOrder.isPaid || actionLoading.paymentUpdate}
              >
                {actionLoading.paymentUpdate ? (
                  <>
                    <span className={styles.spinner}></span> {t('Updating...')}
                  </>
                ) : (
                  t('Mark as Unpaid')
                )}
              </button>
            </div>
            <button
              className={styles.modalCancelBtn}
              onClick={() => {
                if (!actionLoading.paymentUpdate) {
                  setShowPaymentModal(false);
                  setEditingOrder(null);
                }
              }}
              disabled={actionLoading.paymentUpdate}
            >
              {t('Cancel')}
            </button>
          </div>
        </div>
      )}

      { }
      {viewingOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '700px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('Order Details')}</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setViewingOrder(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <p className={styles.modalInfo}>
                  <strong>{t('Order ID')}:</strong> #{viewingOrder._id.slice(-8).toUpperCase()}
                </p>
                <p className={styles.modalInfo}>
                  <strong>{t('Customer')}:</strong> {viewingOrder.user?.name || 'N/A'} ({viewingOrder.user?.email || 'N/A'})
                </p>
                <p className={styles.modalInfo}>
                  <strong>{t('Date')}:</strong> {formatDate(viewingOrder.createdAt)}
                </p>
                <p className={styles.modalInfo}>
                  <strong>{t('Payment Method:')}</strong> {viewingOrder.paymentMethod}
                </p>
                <p className={styles.modalInfo}>
                  <strong>{t('Payment Status:')}</strong>
                  <span className={`${styles.paymentBadge} ${viewingOrder.isPaid ? styles.paymentPaid : styles.paymentUnpaid}`} style={{ marginLeft: '0.5rem' }}>
                    {viewingOrder.isPaid ? t('Paid') : t('Unpaid')}
                  </span>
                </p>
                {viewingOrder.paidAt && (
                  <p className={styles.modalInfo}>
                    <strong>{t('Paid At:')}</strong> {formatDate(viewingOrder.paidAt)}
                  </p>
                )}
                {viewingOrder.paymentResult && (
                  <div className={styles.modalInfo}>
                    <strong>{t('Payment Details:')}</strong>
                    <div className={styles.detailSection} style={{ marginTop: '0.5rem' }}>
                      {viewingOrder.paymentResult.id && <div>{t('Transaction ID:')} {viewingOrder.paymentResult.id}</div>}
                      {viewingOrder.paymentResult.status && <div>{t('Status:')} {viewingOrder.paymentResult.status}</div>}
                      {viewingOrder.paymentResult.emailAddress && <div>{t('Email:')} {viewingOrder.paymentResult.emailAddress}</div>}
                    </div>
                  </div>
                )}
                <p className={styles.modalInfo}>
                  <strong>{t('Order Status:')}</strong>
                  <span className={`${styles.statusBadge} ${styles[`status${viewingOrder.orderStatus}`]}`} style={{ marginLeft: '0.5rem' }}>
                    {t(viewingOrder.orderStatus)}
                  </span>
                </p>
              </div>

              <div className={styles.detailSection}>
                <strong>{t('Items')}:</strong>
                <ul className={styles.detailList}>
                  {viewingOrder.orderItems?.map((item, idx) => (
                    <li key={idx}>
                      {item.name} - Qty: {item.quantity} - {formatAmount(item.price * item.quantity)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.detailSection}>
                <p className={styles.modalInfo}><strong>{t('Subtotal:')}</strong> {formatAmount(viewingOrder.itemsPrice)}</p>
                <p className={styles.modalInfo}><strong>{t('Tax:')}</strong> {formatAmount(viewingOrder.taxPrice)}</p>
                <p className={styles.modalInfo}><strong>{t('Shipping:')}</strong> {formatAmount(viewingOrder.shippingPrice)}</p>
                <p className={styles.modalInfo} style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                  <strong>{t('Total:')}</strong> {formatAmount(viewingOrder.totalPrice)}
                </p>
              </div>

              <div className={styles.detailSection}>
                <strong>{t('Shipping Address:')}</strong>
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                  {viewingOrder.shippingAddress?.addressLine}, {viewingOrder.shippingAddress?.city},
                  {viewingOrder.shippingAddress?.state} - {viewingOrder.shippingAddress?.pincode}
                </div>
              </div>
            </div>

            <button
              className={styles.modalCancelBtn}
              onClick={() => setViewingOrder(null)}
            >
              {t('Close')}
            </button>
          </div>
        </div>
      )}

      { }
      {showStatusModal && editingOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('Update Order Status')}</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => {
                  if (!actionLoading.statusUpdate) {
                    setShowStatusModal(false);
                    setEditingOrder(null);
                  }
                }}
                disabled={actionLoading.statusUpdate}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalInfo}>
                {t('Order ID')}: #{editingOrder._id.slice(-8).toUpperCase()}
              </p>
              <p className={styles.modalInfo}>
                {t('Current Status:')} <strong>{t(editingOrder.orderStatus)}</strong>
              </p>
            </div>
            <div className={styles.modalActions}>
              {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                  onClick={() => confirmStatusUpdate(status)}
                  disabled={status === editingOrder.orderStatus || actionLoading.statusUpdate}
                >
                  {actionLoading.statusUpdate ? (
                    <>
                      <span className={styles.spinner}></span> {t('Updating...')}
                    </>
                  ) : (
                    t(status)
                  )}
                </button>
              ))}
            </div>
            <button
              className={styles.modalCancelBtn}
              onClick={() => {
                if (!actionLoading.statusUpdate) {
                  setShowStatusModal(false);
                  setEditingOrder(null);
                }
              }}
              disabled={actionLoading.statusUpdate}
            >
              {t('Cancel')}
            </button>
          </div>
        </div>
      )}

      { }
      {showDeleteModal && deletingOrder && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{t('Delete Order')}</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={cancelDeleteOrder}
                disabled={actionLoading.delete}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalInfo}>
                {t('Are you sure you want to delete this order?')}
              </p>
              <p className={styles.modalInfo}>
                <strong>{t('Order ID')}:</strong> #{deletingOrder._id.slice(-8).toUpperCase()}
              </p>
              <p className={styles.modalInfo}>
                <strong>{t('Customer')}:</strong> {deletingOrder.user?.name || 'N/A'}
              </p>
              <p className={styles.modalInfo}>
                <strong>{t('Amount')}:</strong> {formatAmount(deletingOrder.totalPrice)}
              </p>
              <p className={styles.modalInfo} style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '1rem' }}>
                {t('⚠️ This action cannot be undone!')}
              </p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
                onClick={confirmDeleteOrder}
                disabled={actionLoading.delete}
              >
                {actionLoading.delete ? (
                  <>
                    <span className={styles.spinner}></span> {t('Deleting order...')}
                  </>
                ) : (
                  t('Delete Order')
                )}
              </button>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                onClick={cancelDeleteOrder}
                disabled={actionLoading.delete}
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Alert Validation Modal */}
      {showPaymentAlertModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', borderTop: '4px solid #f59e0b' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span> {t('Action Not Allowed')}
              </h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowPaymentAlertModal(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody} style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p className={styles.modalInfo} style={{ fontSize: '1.1rem', color: '#1f2937' }}>
                {t('Cannot mark as Delivered! Payment is not completed.')}
              </p>
              <p className={styles.modalInfo} style={{ marginTop: '0.75rem', color: '#6b7280', fontSize: '0.9rem' }}>
                {t('Please ensure the order is marked as Paid before updating the status to Delivered.')}
              </p>
            </div>
            <div className={styles.modalActions} style={{ justifyContent: 'center' }}>
              <button
                className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                onClick={() => setShowPaymentAlertModal(false)}
                style={{ backgroundColor: '#f59e0b', width: '100%' }}
              >
                {t('Understand')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Orders;
