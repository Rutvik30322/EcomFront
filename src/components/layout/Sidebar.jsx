import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMe } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import styles from './Sidebar.module.css';
import dabboLogo from '../../assets/Dabbo-Logo-icon-white.png';
import dashboardIcon from '../../assets/svg/dashboard.svg';
import productIcon from '../../assets/svg/product.svg';
import bannerIcon from '../../assets/svg/banner.svg';
import orderIcon from '../../assets/svg/orders.svg';
import categoryIcon from '../../assets/svg/categories.svg';
import brandIcon from '../../assets/svg/brand.svg';
import reviewIcon from '../../assets/svg/reviews.svg';
import userIcon from '../../assets/svg/usermanagement.svg';
import adminIcon from '../../assets/svg/admin.svg';
import stocksIcon from '../../assets/svg/stocks.svg';
import notificationIcon from "../../assets/svg/notification.svg";
import profileIcon from "../../assets/svg/profile.svg";
import purchaseIcon from "../../assets/svg/purchase.svg";


const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [currentRole, setCurrentRole] = useState(user?.role || 'admin');

  // Refresh admin data on mount to get latest role
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await getMe();
        if (response?.admin) {
          const adminData = response.admin;
          setCurrentRole(adminData.role || 'admin');
          // Update Redux state and localStorage with fetched admin data
          dispatch(setUser(adminData));
        } else if (user?.role) {
          setCurrentRole(user.role);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        // Fallback to user from store
        if (user?.role) {
          setCurrentRole(user.role);
        }
      }
    };

    if (user?.role) {
      setCurrentRole(user.role);
    } else {
      // Fetch admin data if user data is not available
      fetchAdminData();
    }
  }, [user, dispatch]);

  const userRole = currentRole;

  // Define all menu items with their required roles
  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <img src={dashboardIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Products', path: '/products', icon: <img src={productIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Stocks', path: '/stocks', icon: <img src={stocksIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Banners', path: '/banners', icon: <img src={bannerIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Orders', path: '/orders', icon: <img src={orderIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Categories', path: '/categories', icon: <img src={categoryIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Brands', path: '/brands', icon: <img src={brandIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Reviews', path: '/reviews', icon: <img src={reviewIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'User Management', path: '/users', icon: <img src={userIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Admin Management', path: '/admins', icon: <img src={adminIcon} alt="Dashboard" width={25} />, roles: ['superadmin'] }, // Only superadmin
    { name: 'Notifications', path: '/notifications', icon: <img src={notificationIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Purchase', path: '/purchaseScreen', icon: <img src={purchaseIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
    { name: 'Profile', path: '/profile', icon: <img src={profileIcon} alt="Dashboard" width={25} />, roles: ['admin', 'superadmin'] },
  ];

  // Filter menu items based on user role
  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  // Debug: Log role for troubleshooting (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
    }
  }, [userRole, user, navItems]);

  // Debug: Log role for troubleshooting
  if (process.env.NODE_ENV === 'development') {
  }

  // Removed auto-close on navigation - sidebar stays open when navigating
  // const handleLinkClick = () => {
  //   if (window.innerWidth <= 768) {
  //     setSidebarOpen(false);
  //   }
  // };

  const handleClose = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`} style={{ left: sidebarOpen ? '0' : '-250px' }}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <img src={dabboLogo} alt="Dabbo Logo" className={styles.logo} />
            <h2 className={styles.sidebarTitle}>Admin Panel</h2>
          </div>
          <button
            className={styles.closeSidebarBtn}
            type="button"
            aria-label="Close sidebar"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (setSidebarOpen) {
                setSidebarOpen(false);
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (setSidebarOpen) {
                  setSidebarOpen(false);
                }
              }
            }}
          >
            <span className={styles.closeIcon}>✕</span>
          </button>
        </div>
        <LanguageSwitcher />
        <nav className={styles.navMenu}>
          <ul className={styles.navList}>
            {navItems.map((item) => {
              // Check if current path matches or starts with the item path
              // This allows parent menu items to be highlighted on child routes
              // e.g., "Products" highlights on /products/add and /products/edit/:id
              let isActive = location.pathname === item.path;

              // Special handling for routes with sub-pages
              if (item.path === '/products' && location.pathname.startsWith('/products')) {
                isActive = true;
              } else if (item.path === '/banners' && location.pathname.startsWith('/banners')) {
                isActive = true;
              } else if (item.path === '/categories' && location.pathname.startsWith('/categories')) {
                isActive = true;
              } else if (item.path === '/brands' && location.pathname.startsWith('/brands')) {
                isActive = true;
              } else if (item.path === '/users' && location.pathname.startsWith('/users')) {
                isActive = true;
              } else if (item.path === '/admins' && location.pathname.startsWith('/admins')) {
                isActive = true;
              } else if (item.path === '/notifications' && location.pathname.startsWith('/notifications')) {
                isActive = true;
              } else if (item.path === '/purchaseScreen' && location.pathname.startsWith('/purchaseScreen')) {
                isActive = true;
              }

              return (
                <li key={item.path} className={styles.navItem}>
                  <Link
                    to={item.path}
                    className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navText}>{t(item.name)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Overlay - removed click-to-close, sidebar only closes via close button */}
      {/* Overlay is now only for visual backdrop on mobile, no click handler */}
    </>
  );
};

export default Sidebar;
