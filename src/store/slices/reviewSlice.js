import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reviewService } from '../../services/api';

export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async ({ product, approved, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await reviewService.getAllReviews(product, approved, page);
      if (response.data && response.data.data) {
        return {
          reviews: response.data.data.reviews || [],
          pagination: response.data.data.pagination || {},
        };
      }
      return { reviews: [], pagination: {} };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const approveReview = createAsyncThunk(
  'reviews/approveReview',
  async ({ id, isApproved }, { rejectWithValue }) => {
    try {
      const response = await reviewService.approveReview(id, isApproved);
      return response.data.data.review;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (id, { rejectWithValue }) => {
    try {
      await reviewService.deleteReview(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: {},
    filters: {
      product: '',
      approved: '',
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
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.reviews;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(approveReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveReview.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(approveReview.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      })

      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item._id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
          state.error = action.payload;
        } else {
          state.error = null;
        }
      });
  },
});

export const { setFilter, clearError } = reviewSlice.actions;
export default reviewSlice.reducer;
