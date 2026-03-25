import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { brandService } from '../../services/api';

export const fetchBrands = createAsyncThunk(
    'brands/fetchBrands',
    async (params = {}, { rejectWithValue }) => {
        try {
            const queryParams = typeof params === 'object' && params !== null ? params : {};
            const response = await brandService.getAllBrands(queryParams);
            if (response.data && response.data.data && Array.isArray(response.data.data.brands)) {
                return response.data.data.brands;
            } else if (response.data && response.data.brands && Array.isArray(response.data.brands)) {
                return response.data.brands;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createBrand = createAsyncThunk(
    'brands/createBrand',
    async (brandData, { rejectWithValue }) => {
        try {
            const response = await brandService.createBrand(brandData);
            return response.data.data.brand || response.data.brand;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const updateBrand = createAsyncThunk(
    'brands/updateBrand',
    async ({ id, brandData }, { rejectWithValue }) => {
        try {
            const response = await brandService.updateBrand(id, brandData);
            return response.data.data.brand || response.data.brand;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deleteBrand = createAsyncThunk(
    'brands/deleteBrand',
    async (id, { rejectWithValue }) => {
        try {
            await brandService.deleteBrand(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const brandSlice = createSlice({
    name: 'brands',
    initialState: {
        items: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Brands
            .addCase(fetchBrands.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBrands.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchBrands.rejected, (state, action) => {
                state.loading = false;
                if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
                    state.error = action.payload;
                } else {
                    state.error = null;
                }
            })
            // Create Brand
            .addCase(createBrand.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBrand.fulfilled, (state, action) => {
                state.loading = false;
                state.items.push(action.payload);
            })
            .addCase(createBrand.rejected, (state, action) => {
                state.loading = false;
                if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
                    state.error = action.payload;
                } else {
                    state.error = null;
                }
            })
            // Update Brand
            .addCase(updateBrand.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBrand.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.items.findIndex(item => item._id === action.payload._id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(updateBrand.rejected, (state, action) => {
                state.loading = false;
                if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
                    state.error = action.payload;
                } else {
                    state.error = null;
                }
            })
            // Delete Brand
            .addCase(deleteBrand.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteBrand.fulfilled, (state, action) => {
                state.loading = false;
                state.items = state.items.filter(item => item._id !== action.payload);
            })
            .addCase(deleteBrand.rejected, (state, action) => {
                state.loading = false;
                if (action.payload !== 'Duplicate request prevented' && !action.payload?.includes?.('Duplicate request prevented')) {
                    state.error = action.payload;
                } else {
                    state.error = null;
                }
            });
    },
});

export const { clearError } = brandSlice.actions;
export default brandSlice.reducer;
