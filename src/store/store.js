import { configureStore } from '@reduxjs/toolkit';
import productReducer from './slices/productSlice';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import adminReducer from './slices/adminSlice';
import categoryReducer from './slices/categorySlice';
import brandReducer from './slices/brandSlice';
import orderReducer from './slices/orderSlice';
import reviewReducer from './slices/reviewSlice';
import purchaseReducer from './slices/purchaseSlice';

export const store = configureStore({
  reducer: {
    products: productReducer,
    auth: authReducer,
    users: userReducer,
    admins: adminReducer,
    categories: categoryReducer,
    brands: brandReducer,
    orders: orderReducer,
    reviews: reviewReducer,
    purchases: purchaseReducer,
  },
});

export default store;