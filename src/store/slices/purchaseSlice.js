import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { purchaseService } from '../../services/api';

export const fetchPurchase = createAsyncThunk(
    'purchase/fetchPurchase',
    async (params = {}, { rejectWithValue }) => {
        try {
            const response = await purchaseService.getAllPurchase(params);

            if (response.data && response.data.data) {
                if (response.data.data.purchases && response.data.data.pagination) {

                    return {
                        purchases: response.data.data.purchases || [],
                        pagination: response.data.data.pagination || { page: 1, pages: 1, total: 0 }
                    };
                } else if (Array.isArray(response.data.data.purchases)) {
                    return {
                        purchases: response.data.data.purchases,
                        pagination: response.data.data.pagination || { page: 1, pages: 1, total: 0 }
                    };
                } else if (Array.isArray(response.data.data)) {

                    return {
                        purchases: response.data.data,
                        pagination: { page: 1, pages: 1, total: response.data.data.length }
                    };
                }
            }
            return { purchases: [], pagination: { page: 1, pages: 1, total: 0 } };
        } catch (error) {
            console.error('Error fetching purchases:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createpurchases = createAsyncThunk(
    'purchases/createpurchases',
    async (purchaseData, { rejectWithValue }) => {

        try {
            const response = await purchaseService.createpurchases(purchaseData);
            return response.data.data.purchase;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const updatepurchases = createAsyncThunk(
    'purchases/updatepurchases',
    async ({ id, purchaseData }, { rejectWithValue }) => {

        try {
            const response = await purchaseService.updatepurchases(id, purchaseData);
            return response.data.data.purchase;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deletepurchases = createAsyncThunk(
    'purchases/deletepurchases',
    async (id, { rejectWithValue }) => {
        try {
            await purchaseService.deletepurchases(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const purchaseSlice = createSlice({
    name: 'purchases',
    initialState: {
        items: [],
        loading: false,
        error: null,
        currentpurchases: null,
        pagination: {
            total: 0,
            page: 1,
            pages: 1,
        },
        currentFilter: {
            search: '',
            category: '',
            inStock: '',
            sort: 'newest',
            page: 1,
            limit: 10,
        }
    },
    reducers: {
        setCurrentpurchases: (state, action) => {
            state.currentpurchases = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setCurrentFilter: (state, action) => {
            state.currentFilter = { ...state.currentFilter, ...action.payload };
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

            .addCase(fetchPurchase.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPurchase.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.purchases) {
                    state.items = action.payload.purchases;
                    state.pagination = action.payload.pagination || { page: 1, pages: 1, total: 0 };
                } else {

                    state.items = Array.isArray(action.payload) ? action.payload : [];
                }
            })
            .addCase(fetchPurchase.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(createpurchases.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createpurchases.fulfilled, (state, action) => {
                state.loading = false;
                state.items.push(action.payload);
            })
            .addCase(createpurchases.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(updatepurchases.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatepurchases.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.items.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
                state.currentpurchases = action.payload;
            })
            .addCase(updatepurchases.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            .addCase(deletepurchases.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletepurchases.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter(item => item._id !== action.payload);
            })
            .addCase(deletepurchases.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { setCurrentpurchases, clearError, setCurrentFilter, resetPagination } = purchaseSlice.actions;
export default purchaseSlice.reducer;