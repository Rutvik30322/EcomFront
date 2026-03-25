import { useState } from 'react';

/**
 * useSidebar - Shared hook for sidebar open/close state.
 * Usage: const { sidebarOpen, setSidebarOpen } = useSidebar();
 */
export const useSidebar = (initialState = true) => {
    const [sidebarOpen, setSidebarOpen] = useState(initialState);
    return { sidebarOpen, setSidebarOpen };
};

export default useSidebar;