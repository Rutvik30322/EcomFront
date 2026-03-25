import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { orderService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import NotificationToast from '../../components/ui/NotificationToast';
import { useTranslation } from 'react-i18next';
import styles from './Dashboard.module.css';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import averageOrderIcon from "../../assets/svg/averageorder.svg";
import activeUserIcon from "../../assets/svg/activeuser.svg";
import paidIcon from "../../assets/svg/paid.svg";
import paymentRateIcon from "../../assets/svg/paymentrate.svg";
import productIcon from '../../assets/svg/productdashboard.svg';
import orderIcon from '../../assets/svg/order.svg';
import revenueIcon from '../../assets/svg/revenue.svg';
import totalUsersIcon from '../../assets/svg/totalusers.svg';
import categoryIcon from '../../assets/svg/categoriesdashboard.svg';
import reviewIcon from '../../assets/svg/reviewdashboard.svg';

const Dashboard = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const { onDataUpdate, socket } = useSocket();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  useEffect(() => {
    if (!onDataUpdate || !socket) {

      return;
    }

    const handleDashboardUpdate = (updatedStats) => {

      if (updatedStats && typeof updatedStats === 'object') {

        setStats(updatedStats);
      }
    };

    socket.on('dashboard-stats-update', handleDashboardUpdate);

    const unsubscribe = onDataUpdate('dashboard', (action, payload) => {
      if (action === 'update' && payload) {

        if (payload.stats) {
          handleDashboardUpdate(payload.stats);
        } else if (payload && typeof payload === 'object') {

          handleDashboardUpdate(payload);
        } else {

          fetchDashboardStats();
        }
      } else if (action === 'refresh') {

        fetchDashboardStats();
      }
    });

    const unsubscribeOrders = onDataUpdate('orders', (action, payload) => {

      if (action === 'create' || action === 'update' || action === 'delete') {

        socket.emit('request-dashboard-update');
      }
    });

    const unsubscribeProducts = onDataUpdate('products', (action, payload) => {

      if (action === 'create' || action === 'update' || action === 'delete') {
        socket.emit('request-dashboard-update');
      }
    });

    const unsubscribeUsers = onDataUpdate('users', (action, payload) => {

      if (action === 'create' || action === 'update' || action === 'delete') {
        socket.emit('request-dashboard-update');
      }
    });

    return () => {
      if (socket) {
        socket.off('dashboard-stats-update', handleDashboardUpdate);
      }
      if (unsubscribe) unsubscribe();
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [onDataUpdate, socket]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getDashboardStats();

      const statsData = response.data?.data?.stats || response.data?.stats || response.data;

      if (process.env.NODE_ENV === 'development') {

      }

      if (!statsData) {
        throw new Error('No stats data received from API');
      }

      setStats(statsData);
    } catch (error) {

      if (error.message === 'Duplicate request prevented') {

        setTimeout(() => {
          fetchDashboardStats();
        }, 500);
        return;
      }

      if (error.isRateLimit) {

        setTimeout(() => {
          fetchDashboardStats();
        }, (error.retryAfter || 5) * 1000);
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching dashboard stats:', error);
        console.error('Error details:', error.response?.data || error.message);
      }

      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage !== 'Duplicate request prevented' && !error.isRateLimit) {
        setError(`Failed to load dashboard data: ${errorMessage}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0, // No decimal places for large amounts
      notation: amount > 999999 ? 'compact' : 'standard', // Use compact notation for very large amounts
    }).format(amount || 0);
    return formatted;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const prepareRevenueData = () => {
    if (!stats?.revenueByMonth || stats.revenueByMonth.length === 0) {
      return [];
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return stats.revenueByMonth.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      revenue: item.revenue || 0,
      orders: item.count || 0,
    }));
  };

  const prepareOrdersByMonthData = () => {
    if (!stats?.ordersByMonth || stats.ordersByMonth.length === 0) {
      return [];
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return stats.ordersByMonth.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      orders: item.count || 0,
    }));
  };

  const prepareOrdersByStatusData = () => {
    if (!stats?.ordersByStatus || stats.ordersByStatus.length === 0) {
      return [];
    }

    return stats.ordersByStatus.map((item) => ({
      name: item._id || 'Unknown',
      value: item.count || 0,
    }));
  };

  const preparePaymentMethodData = () => {
    if (!stats?.ordersByPaymentMethod || stats.ordersByPaymentMethod.length === 0) {
      return [];
    }

    return stats.ordersByPaymentMethod.map((item) => ({
      name: item._id || 'Unknown',
      value: item.count || 0,
      paid: item.paid || 0,
      unpaid: item.unpaid || 0,
    }));
  };

  const prepareRevenueByPaymentMethodData = () => {
    if (!stats?.revenueByPaymentMethod || stats.revenueByPaymentMethod.length === 0) {
      return [];
    }

    return stats.revenueByPaymentMethod.map((item) => ({
      method: item._id || 'Unknown',
      revenue: item.revenue || 0,
      orders: item.count || 0,
    }));
  };

  const STATUS_COLORS = {
    'Pending': '#f59e0b',
    'Processing': '#3b82f6',
    'Shipped': '#8b5cf6',
    'Delivered': '#10b981',
    'Cancelled': '#ef4444',
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || '#6b7280';
  };

  const revenueData = prepareRevenueData();
  const ordersByStatusData = prepareOrdersByStatusData();
  const ordersByMonthData = prepareOrdersByMonthData();
  const paymentMethodData = preparePaymentMethodData();
  const revenueByPaymentMethodData = prepareRevenueByPaymentMethodData();

  // ── Skeleton stat card ──────────────────────────────────────
  const SkeletonCard = () => (
    <div style={{
      background: 'white',
      borderRadius: '14px',
      padding: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 1px 6px rgba(15,27,53,0.06)',
      border: '1px solid #E2E8F0',
      overflow: 'hidden',
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: '50%',
        background: 'linear-gradient(90deg,#f0f4ff 25%,#e2e8f0 50%,#f0f4ff 75%)',
        backgroundSize: '400px 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          height: 20, width: '55%', borderRadius: 6, marginBottom: 8,
          background: 'linear-gradient(90deg,#f0f4ff 25%,#e2e8f0 50%,#f0f4ff 75%)',
          backgroundSize: '400px 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
        }} />
        <div style={{
          height: 13, width: '35%', borderRadius: 4,
          background: 'linear-gradient(90deg,#f0f4ff 25%,#e2e8f0 50%,#f0f4ff 75%)',
          backgroundSize: '400px 100%',
          animation: 'shimmer 1.4s ease-in-out infinite',
        }} />
      </div>
    </div>
  );

  if (loading && !stats) {
    return (
      <div className={styles.dashboardContainer}>
        <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`${styles.mainContent} ${!sidebarOpen ? styles.mainContentExpanded : ''}`}>
          <Header
            title={t('Admin Dashboard')}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className={styles.dashboardContent}>
            <div className={styles.statsGrid} style={{ marginBottom: '2rem' }}>
              {[...Array(4)].map((_,i) => <SkeletonCard key={i} />)}
            </div>
            <div className={styles.statsGrid}>
              {[...Array(6)].map((_,i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      { }
      <NotificationToast />

      { }
      <main className={`${styles.mainContent} ${!sidebarOpen ? styles.mainContentExpanded : ''}`}>
        <Header
          title={t("Admin Dashboard")}
          onRefresh={fetchDashboardStats}
          refreshLoading={loading}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className={styles.dashboardContent}>
          { }

          {error && (
            <div className={styles.errorMessage}>
              {error}
              <button onClick={fetchDashboardStats} className={styles.retryBtn}>{t('Retry')}</button>
            </div>
          )}

          { }
          {stats && (
            <div className={styles.statsGrid} style={{ marginBottom: '2rem' }}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><img src={averageOrderIcon} alt="Average Order" width={50} /></div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statValue}>{formatCurrency(stats.avgOrderValue || 0)}</h3>
                  <p className={styles.statLabel}>{t('Average Order Value')}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><img src={activeUserIcon} alt="Active User" width={50} /></div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statValue}>{stats.activeUsers || 0}</h3>
                  <p className={styles.statLabel}>{t('Active Users')}</p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><img src={paidIcon} alt="Paid Order" width={50} /></div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statValue}>{stats.paidOrders || 0}</h3>
                  <p className={styles.statLabel}>{t('Paid Orders')}</p>
                  <p className={styles.statSubLabel}>
                    {stats.unpaidOrders || 0} {t('unpaid')}
                  </p>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}><img src={paymentRateIcon} alt="Payment Rate" width={50} /></div>
                <div className={styles.statInfo}>
                  <h3 className={styles.statValue}>
                    {stats.totalOrders > 0
                      ? `${((stats.paidOrders / stats.totalOrders) * 100).toFixed(1)}%`
                      : '0%'}
                  </h3>
                  <p className={styles.statLabel}>{t('Payment Rate')}</p>
                </div>
              </div>
            </div>
          )}

          { }
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}> <img src={productIcon} alt="Products" width={50} /></div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>{stats?.totalProducts || 0}</h3>
                <p className={styles.statLabel}>{t('Total Products')}</p>
                {stats?.outOfStockProducts > 0 && (
                  <p className={styles.statSubLabel}>
                    {stats.outOfStockProducts} {t('out of stock')}
                  </p>
                )}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><img src={orderIcon} alt="Orders" width={50} /></div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>{stats?.totalOrders || 0}</h3>
                <p className={styles.statLabel}>{t('Total Orders')}</p>
                <p className={styles.statSubLabel}>
                  {stats?.thisMonthOrders || 0} {t('this month')}, {stats?.todayOrders || 0} {t('today')}
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><img src={revenueIcon} alt="Revenue" width={50} /></div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>{formatCurrency(stats?.totalRevenue)}</h3>
                <p className={styles.statLabel}>{t('Total Revenue')}</p>
                <p className={styles.statSubLabel}>
                  {formatCurrency(stats?.thisMonthRevenue || 0)} {t('this month')}
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><img src={totalUsersIcon} alt="Total Users" width={50} /></div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>{stats?.totalUsers || 0}</h3>
                <p className={styles.statLabel}>{t('Total Users')}</p>
                <p className={styles.statSubLabel}>
                  {stats?.customers || 0} {t('customers')}, {stats?.admins || 0} {t('admins')}
                </p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><img src={categoryIcon} alt="Categories" width={50} /></div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>{stats?.totalCategories || 0}</h3>
                <p className={styles.statLabel}>{t('Categories')}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}><img src={reviewIcon} alt="Reviews" width={50} /></div>
              <div className={styles.statInfo}>
                <h3 className={styles.statValue}>{stats?.totalReviews || 0}</h3>
                <p className={styles.statLabel}>{t('Total Reviews')}</p>
                <p className={styles.statSubLabel}>
                  {stats?.approvedReviews || 0} {t('approved')}, {stats?.pendingReviews || 0} {t('pending')}
                </p>
              </div>
            </div>
          </div>

          { }
          <div className={styles.chartsGrid}>
            { }
            <div className={styles.chartSection}>
              <h3 className={styles.sectionTitle}>{t('Revenue Trend (Last 6 Months)')}</h3>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelStyle={{ color: '#333' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChart}>
                  <p>No revenue data available for the last 6 months</p>
                </div>
              )}
            </div>

            { }
            <div className={styles.chartSection}>
              <h3 className={styles.sectionTitle}>{t('Orders by Status')}</h3>
              {ordersByStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ordersByStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ordersByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChart}>
                  <p>No orders data available</p>
                </div>
              )}
            </div>

            { }
            <div className={styles.chartSection}>
              <h3 className={styles.sectionTitle}>{t('Orders Count (Last 6 Months)')}</h3>
              {ordersByMonthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ordersByMonthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" fill="#10b981" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChart}>
                  <p>No orders data available for the last 6 months</p>
                </div>
              )}
            </div>
          </div>

          { }
          <div className={styles.chartsGrid}>
            { }
            {paymentMethodData.length > 0 && (
              <div className={styles.chartSection}>
                <h3 className={styles.sectionTitle}>{t('Orders by Payment Method')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            { }
            {revenueByPaymentMethodData.length > 0 && (
              <div className={styles.chartSection}>
                <h3 className={styles.sectionTitle}>{t('Revenue by Payment Method')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByPaymentMethodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelStyle={{ color: '#333' }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            { }
            {stats?.paymentStatusBreakdown && (
              <div className={styles.chartSection}>
                <h3 className={styles.sectionTitle}>{t('Payment Status')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Paid', value: stats.paymentStatusBreakdown.paid || 0 },
                        { name: 'Unpaid', value: stats.paymentStatusBreakdown.unpaid || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          { }
          { }

          { }
          {stats?.recentOrders && stats.recentOrders.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('Recent Orders')}</h3>
              <div className={styles.recentOrdersTable}>
                <table>
                  <thead>
                    <tr>
                      <th>{t('Order ID')}</th>
                      <th>{t('Customer')}</th>
                      <th>{t('Amount')}</th>
                      <th>{t('Status')}</th>
                      <th>{t('Date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>#{order._id.slice(-6)}</td>
                        <td>{order.user?.name || 'N/A'}</td>
                        <td>{formatCurrency(order.totalPrice)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles[order.orderStatus]}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          { }
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('Quick Actions')}</h3>
            <div className={styles.quickActions}>
              <a href="/products" className={styles.actionCard}>
                <div className={styles.actionIcon}><img src={productIcon} alt="Product" width={50} /></div>
                <h3>{t('Manage Products')}</h3>
                <p>{t('Add, edit, and manage your chocolate products')}</p>
              </a>

              <a href="/orders" className={styles.actionCard}>
                <div className={styles.actionIcon}><img src={orderIcon} alt="Orders" width={50} /></div>
                <h3>{t('View Orders')}</h3>
                <p>{t('Check and manage customer orders')}</p>
              </a>

              <a href="/users" className={styles.actionCard}>
                <div className={styles.actionIcon}><img src={totalUsersIcon} alt="Customers" width={50} /></div>
                <h3>{t('Customer List')}</h3>
                <p>{t('View and manage customer information')}</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;