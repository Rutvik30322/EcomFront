# Socket.IO Live Data Implementation Guide

## Overview
This guide explains how Socket.IO is implemented in the admin panel for real-time data updates without page refresh.

## Architecture

### 1. Socket Context (`src/contexts/SocketContext.jsx`)
The SocketContext provides a centralized Socket.IO connection that:
- Connects automatically when admin is authenticated
- Manages connection state
- Handles notifications
- Provides `onDataUpdate` callback system for real-time updates

### 2. How to Use Socket.IO in Components

#### Basic Implementation Pattern

```jsx
import { useSocket } from '../contexts/SocketContext';

const YourComponent = () => {
  const { onDataUpdate, socket } = useSocket();
  const [data, setData] = useState([]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    if (!onDataUpdate || !socket) return;

    // Subscribe to data updates for your data type
    const unsubscribe = onDataUpdate('yourDataType', (action, payload) => {
      // Handle different actions
      if (action === 'create') {
        // Add new item to list
        setData(prev => [payload, ...prev]);
      } else if (action === 'update') {
        // Update existing item
        setData(prev => prev.map(item => 
          item._id === payload._id ? payload : item
        ));
      } else if (action === 'delete') {
        // Remove item from list
        setData(prev => prev.filter(item => item._id !== payload._id));
      } else if (action === 'refresh') {
        // Force full refresh
        fetchData();
      }
    });

    // Cleanup on unmount
    return unsubscribe;
  }, [onDataUpdate, socket]);

  return (
    // Your component JSX
  );
};
```

## Implementation Examples

### Example 1: Orders Component (List Updates)

```jsx
// Listen for real-time order updates
useEffect(() => {
  if (!onDataUpdate) return;

  const unsubscribe = onDataUpdate('orders', (action, payload) => {
    // Refresh orders list when data changes
    dispatch(fetchOrders({ status: statusFilter, page: 1 }));
  });

  return unsubscribe;
}, [onDataUpdate, dispatch, statusFilter]);
```

### Example 2: Dashboard Component (Stats Updates)

```jsx
// Listen for real-time dashboard stats updates
useEffect(() => {
  if (!onDataUpdate || !socket) return;

  // Handle dashboard stats update
  const handleDashboardUpdate = (updatedStats) => {
    if (updatedStats && typeof updatedStats === 'object') {
      setStats(prevStats => ({
        ...prevStats,
        ...updatedStats,
        // Preserve nested objects
        revenueByMonth: updatedStats.revenueByMonth || prevStats.revenueByMonth,
        ordersByStatus: updatedStats.ordersByStatus || prevStats.ordersByStatus,
      }));
    }
  };

  // Listen for specific dashboard stats update event
  socket.on('dashboard-stats-update', handleDashboardUpdate);

  // Listen for general data updates
  const unsubscribe = onDataUpdate('dashboard', (action, payload) => {
    if (action === 'update' && payload?.stats) {
      handleDashboardUpdate(payload.stats);
    } else if (action === 'refresh') {
      fetchDashboardStats();
    }
  });

  // Listen for related data changes
  const unsubscribeOrders = onDataUpdate('orders', (action, payload) => {
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
  };
}, [onDataUpdate, socket]);
```

## Available Socket Events

### Client → Server Events
- `join-admin` - Join admin room (auto-called on connection)
- `request-dashboard-update` - Request dashboard stats update

### Server → Client Events
- `notification` - New notification received
- `data-update` - Generic data update
  ```javascript
  {
    type: 'orders' | 'products' | 'users' | 'categories' | 'reviews' | 'dashboard',
    action: 'create' | 'update' | 'delete' | 'refresh',
    payload: { /* data */ }
  }
  ```
- `dashboard-stats-update` - Dashboard statistics update
  ```javascript
  {
    totalOrders: number,
    totalRevenue: number,
    totalProducts: number,
    // ... other stats
  }
  ```

## Data Types

The following data types are supported:
- `orders` - Order updates
- `products` - Product updates
- `users` - User updates
- `categories` - Category updates
- `reviews` - Review updates
- `dashboard` - Dashboard stats updates

## Best Practices

1. **Always Clean Up**: Unsubscribe from socket events in useEffect cleanup
2. **Check Connection**: Verify `socket` and `onDataUpdate` exist before using
3. **Handle Errors**: Wrap socket operations in try-catch
4. **Merge Updates**: For complex data, merge updates instead of replacing
5. **Avoid Duplicate Requests**: Use flags or debouncing to prevent duplicate API calls

## Backend Implementation

The backend emits updates using:
```javascript
// From backend/utils/notifications.js
emitDataUpdate('orders', 'create', orderData);
emitDashboardStatsUpdate();
```

## Testing

1. Open admin panel in browser
2. Open browser console to see socket events
3. Make changes in another tab/window
4. Verify updates appear in real-time without refresh

## Troubleshooting

### Socket not connecting
- Check if admin is authenticated
- Verify backend URL in SocketContext
- Check browser console for connection errors

### Updates not received
- Verify you're subscribed to correct data type
- Check if socket is connected (`isConnected` from useSocket)
- Ensure backend is emitting events correctly

### Performance issues
- Limit update frequency on backend
- Use debouncing for rapid updates
- Consider pagination for large lists
