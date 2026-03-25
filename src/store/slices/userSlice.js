import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/api';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await userService.getAllUsers(params);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await userService.createUser(userData);
      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, userData }, { rejectWithValue }) => {
    try {
      const response = await userService.updateUser(id, userData);
      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await userService.deleteUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  'users/toggleUserStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await userService.toggleUserStatus(id);
      return response.data.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
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

      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(toggleUserStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      });
  },
});

export const { setCurrentFilter, clearError, resetPagination } = userSlice.actions;
export default userSlice.reducer;