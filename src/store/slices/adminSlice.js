import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminService } from '../../services/api';

export const fetchAdmins = createAsyncThunk(
  'admins/fetchAdmins',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await adminService.getAllAdmins(params);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching admins:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createAdmin = createAsyncThunk(
  'admins/createAdmin',
  async (adminData, { rejectWithValue }) => {
    try {
      const response = await adminService.createAdmin(adminData);
      return response.data.data.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAdmin = createAsyncThunk(
  'admins/updateAdmin',
  async ({ id, adminData }, { rejectWithValue }) => {
    try {
      const response = await adminService.updateAdmin(id, adminData);
      return response.data.data.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAdmin = createAsyncThunk(
  'admins/deleteAdmin',
  async (id, { rejectWithValue }) => {
    try {
      await adminService.deleteAdmin(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleAdminStatus = createAsyncThunk(
  'admins/toggleAdminStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await adminService.toggleAdminStatus(id);
      return response.data.data.admin;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const adminSlice = createSlice({
  name: 'admins',
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      pages: 1,
    },
    currentFilter: {
      search: '',
      role: '',
      isActive: '',
      sort: 'newest',
      page: 1,
      limit: 10,
    }
  },
  reducers: {
    setCurrentFilter: (state, action) => {
      state.currentFilter = { ...state.currentFilter, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetPagination: (state) => {
      state.pagination = {
        total: 0,
        page: 1,
        pages: 1,
      };
    }
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchAdmins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.admins;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(createAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createAdmin.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(updateAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdmin.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateAdmin.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(deleteAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteAdmin.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(toggleAdminStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleAdminStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleAdminStatus.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      });
  },
});

export const { setCurrentFilter, clearError, resetPagination } = adminSlice.actions;
export default adminSlice.reducer;
