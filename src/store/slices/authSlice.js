import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginAdmin } from '../../services/authService';

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('adminUser');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  token: localStorage.getItem('adminToken'),
  isLoading: false,
  isAuthenticated: localStorage.getItem('adminToken') ? true : false,
  error: null,
  success: null,
};

export const adminLogin = createAsyncThunk(
  'auth/adminLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginAdmin(credentials);

      localStorage.setItem('adminToken', response.token);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const adminLogout = createAsyncThunk(
  'auth/adminLogout',
  async (_, { dispatch }) => {

    localStorage.removeItem('adminToken');
    return null;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    resetAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.success = null;

      localStorage.removeItem('adminUser');
    },
    setUser: (state, action) => {
      state.user = action.payload;

      if (action.payload) {
        localStorage.setItem('adminUser', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('adminUser');
      }
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(adminLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        const adminData = action.payload.admin || action.payload.user; // Handle both admin and user responses
        state.user = adminData;
        state.token = action.payload.token;
        state.success = 'Login successful!';

        if (adminData) {
          localStorage.setItem('adminUser', JSON.stringify(adminData));
        }
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = null;
      })

      .addCase(adminLogout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.success = 'Logged out successfully!';

        localStorage.removeItem('adminUser');
      });
  },
});

export const { clearError, clearSuccess, resetAuth, setUser } = authSlice.actions;
export default authSlice.reducer;