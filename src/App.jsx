import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { adminLogout } from './store/slices/authSlice';
import { SocketProvider } from './contexts/SocketContext';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/products/Products';
import EditProduct from './pages/products/EditProduct';
import Orders from './pages/orders/Orders';
import Customers from './pages/profile/Customers';
import Users from './pages/users/Users';
import EditUser from './pages/users/EditUser';
import Admins from './pages/admins/Admins';
import EditAdmin from './pages/admins/EditAdmin';
import Categories from './pages/categories/Categories';
import EditCategory from './pages/categories/EditCategory';
import Reviews from './pages/reviews/Reviews';
import Profile from './pages/profile/Profile';
import ForgotPassword from './pages/auth/ForgotPassword';
import Notifications from './pages/notifications/Notifications';
import Banners from './pages/banners/Banners';
import Brands from './pages/brands/Brands';
import EditBrand from './pages/brands/EditBrand';
import Chatbot from './components/chatbot/Chatbot';
import ChatbotWidget from './components/chatbot/ChatbotWidget';
import Purchase from './pages/purchases/PurchaseScreen'
import EditPurchase from './pages/purchases/EditPurchase';
import Stocks from './pages/stocks/Stocks';

function AppContent() {
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(adminLogout());
  };

  React.useEffect(() => {
    const handleSessionExpired = () => {
      handleLogout();
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [dispatch]);

  return (
    <Routes>
      <Route
        path="/login"
        element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/products"
        element={isAuthenticated ? <Products onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/products/add"
        element={isAuthenticated ? <EditProduct /> : <Navigate to="/login" />}
      />
      <Route
        path="/products/edit/:id"
        element={isAuthenticated ? <EditProduct /> : <Navigate to="/login" />}
      />
      <Route
        path="/orders"
        element={isAuthenticated ? <Orders onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/customers"
        element={isAuthenticated ? <Customers onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/users"
        element={isAuthenticated ? <Users onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/users/add"
        element={isAuthenticated ? <EditUser /> : <Navigate to="/login" />}
      />
      <Route
        path="/users/edit/:id"
        element={isAuthenticated ? <EditUser /> : <Navigate to="/login" />}
      />
      <Route
        path="/admins"
        element={isAuthenticated ? <Admins onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/admins/add"
        element={isAuthenticated ? <EditAdmin /> : <Navigate to="/login" />}
      />
      <Route
        path="/admins/edit/:id"
        element={isAuthenticated ? <EditAdmin /> : <Navigate to="/login" />}
      />
      <Route
        path="/categories"
        element={isAuthenticated ? <Categories onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/categories/add"
        element={isAuthenticated ? <EditCategory /> : <Navigate to="/login" />}
      />
      <Route
        path="/categories/edit/:id"
        element={isAuthenticated ? <EditCategory /> : <Navigate to="/login" />}
      />
      <Route
        path="/brands"
        element={isAuthenticated ? <Brands /> : <Navigate to="/login" />}
      />
      <Route
        path="/brands/add"
        element={isAuthenticated ? <EditBrand /> : <Navigate to="/login" />}
      />
      <Route
        path="/brands/edit/:id"
        element={isAuthenticated ? <EditBrand /> : <Navigate to="/login" />}
      />
      <Route
        path="/reviews"
        element={isAuthenticated ? <Reviews onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/banners"
        element={isAuthenticated ? <Banners /> : <Navigate to="/login" />}
      />
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile onLogout={handleLogout} /> : <Navigate to="/login" />}
      />
      <Route
        path="/notifications"
        element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />}
      />
      <Route
        path="/chatbot"
        element={isAuthenticated ? <Chatbot /> : <Navigate to="/login" />}
      />
      <Route
        path="/purchaseScreen"
        element={isAuthenticated ? <Purchase /> : <Navigate to="/purchaseScreen" />}
      />
      <Route
        path="/purchaseScreen/add"
        element={isAuthenticated ? <EditPurchase /> : <Navigate to="/EditPurchase" />}
      />
      <Route
        path="/purchaseScreen/edit/:id"
        element={isAuthenticated ? <EditPurchase /> : <Navigate to="/login" />}
      />
      <Route
        path="/stocks"
        element={isAuthenticated ? <Stocks /> : <Navigate to="/login" />}
      />
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <SocketProvider>
        <div className="App">
          <AppContent />
          <ChatbotWidget />
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;