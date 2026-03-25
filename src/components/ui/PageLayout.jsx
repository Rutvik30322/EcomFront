import React from 'react';
import Sidebar from '../layout/Sidebar';
import Header from '../layout/Header';
import LoadingOverlay from './LoadingOverlay';
import dashboardStyles from '../../pages/dashboard/Dashboard.module.css';

/**
 * PageLayout — wraps the full page shell used by every list/detail page.
 *
 * Props:
 *   title          {string}   Header title
 *   sidebarOpen    {boolean}
 *   setSidebarOpen {function}
 *   loading        {boolean}  Shows LoadingOverlay when true
 *   loadingMessage {string}   Message shown in overlay
 *   children       {ReactNode}
 */
const PageLayout = ({
    title,
    sidebarOpen,
    setSidebarOpen,
    loading = false,
    loadingMessage = 'Loading...',
    children,
}) => (
    <div className={dashboardStyles.dashboardContainer}>
        <LoadingOverlay show={loading} message={loadingMessage} />
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`${dashboardStyles.mainContent} ${!sidebarOpen ? dashboardStyles.mainContentExpanded : ''}`}>
            <Header title={title} onMenuToggle={() => setSidebarOpen(o => !o)} />
            <div className={dashboardStyles.dashboardContent}>
                {children}
            </div>
        </main>
    </div>
);

export default PageLayout;
