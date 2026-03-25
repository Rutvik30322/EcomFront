import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '../../services/api';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ status, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await orderService.getAllOrders(status, page);
      if (response.data && response.data.data) {
        return {
          orders: response.data.data.orders || [],
          pagination: response.data.data.pagination || {},
        };
      }
      return { orders: [], pagination: {} };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await orderService.updateOrderStatus(id, orderStatus);
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await orderService.getOrderById(id);
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteOrder = createAsyncThunk(
  'orders/deleteOrder',
  async (id, { rejectWithValue }) => {
    try {
      await orderService.deleteOrder(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    currentOrder: null,
    loading: false,
    error: null,
    pagination: {},
    filters: {
      status: '',
      page: 1,
    },
  },
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item._id !== action.payload);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      });
  },
});

export const { setFilter, clearError, clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
