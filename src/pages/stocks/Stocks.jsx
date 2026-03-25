import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, setCurrentFilter, updateProduct } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchBrands } from '../../store/slices/brandSlice';
import { useSocket } from '../../contexts/SocketContext';
import { useTranslation } from 'react-i18next';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import SearchInput from '../../components/ui/SearchInput';
import Dropdown from '../../components/ui/Dropdown';
import styles from './Stocks.module.css';
import editIcon from "../../assets/svg/edit.svg";

const Stocks = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: products, loading, error, pagination, currentFilter } = useSelector(state => state.products);
  const { items: categories } = useSelector(state => state.categories);
  const { items: brands } = useSelector(state => state.brands);
  const { onDataUpdate } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [actionLoading, setActionLoading] = useState({ pagination: false });
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockValue, setEditingStockValue] = useState("");
  const [isSavingStock, setIsSavingStock] = useState(false);

  const allCategories = Array.isArray(categories) ? categories : [];
  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const categoryNames = allCategories.length > 0
    ? allCategories.map(cat => cat.name).filter(Boolean)
    : uniqueCategories;

  const allBrands = Array.isArray(brands) ? brands : [];
  const uniqueBrands = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  const brandNames = allBrands.length > 0
    ? allBrands.map(b => b.brandName).filter(Boolean)
    : uniqueBrands;

  useEffect(() => {
    dispatch(fetchCategories(false));
    dispatch(fetchBrands({}));
  }, [dispatch]);

  useEffect(() => { dispatch(fetchProducts(currentFilter)); }, [dispatch, currentFilter]);

  useEffect(() => {
    if (!onDataUpdate) return;
    return onDataUpdate('products', () => dispatch(fetchProducts(currentFilter)));
  }, [onDataUpdate, dispatch, currentFilter]);

  const handleFilterChange = (filterType, value) =>
    dispatch(setCurrentFilter({ [filterType]: value, page: 1 }));

  const handlePageChange = async (newPage) => {
    setActionLoading(prev => ({ ...prev, pagination: true }));
    try {
      dispatch(setCurrentFilter({ page: newPage }));
      await dispatch(fetchProducts({ ...currentFilter, page: newPage }));
    } finally {
      setActionLoading(prev => ({ ...prev, pagination: false }));
    }
  };

  const handleEditStock = (product) => {
    setEditingStockId(product._id);
    setEditingStockValue(product.stock || 0);
  };

  const handleCancelEdit = () => {
    setEditingStockId(null);
    setEditingStockValue("");
  };

  const handleSaveStock = async (product) => {
    const newStock = Number(editingStockValue);
    if (isNaN(newStock) || newStock < 0 || editingStockValue === "") {
      alert("Please enter a valid stock quantity");
      return;
    }

    setIsSavingStock(true);
    try {
      await dispatch(updateProduct({
        id: product._id,
        productData: { stock: newStock }
      })).unwrap();
      setEditingStockId(null);
      dispatch(fetchProducts(currentFilter));
    } catch (err) {
      alert("Failed to update stock: " + (err?.message || "Unknown error"));
    } finally {
      setIsSavingStock(false);
    }
  };

  return (
    <>
      <PageLayout
        title={t("Stock Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.pagination}
        loadingMessage={actionLoading.pagination ? t('Loading page...') : t('Loading products...')}
      >
        <RefreshBanner show={loading && products.length > 0} label="products" />

        <div className={styles.productsHeader}>
          <h2 className={styles.productsTitle}>{t('Stock Inventory')}</h2>
        </div>

        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <SearchInput
              value={currentFilter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={t("Search products...")}
            />
          </div>
          <div className={styles.filterGroup}>
            <Dropdown
              value={currentFilter.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              placeholder={t("All Categories")}
              options={categoryNames.map(cat => ({ value: cat, label: cat }))}
            />
          </div>
          <div className={styles.filterGroup}>
            <Dropdown
              value={currentFilter.brand || ''}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              placeholder={t("All Brands")}
              options={brandNames.map(brand => ({ value: brand, label: brand }))}
            />
          </div>
          <div className={styles.filterGroup}>
            <Dropdown
              value={currentFilter.inStock || ''}
              onChange={(e) => handleFilterChange('inStock', e.target.value)}
              placeholder={t("All Stock Status")}
              options={[
                { value: 'true', label: t('In Stock') },
                { value: 'false', label: t('Out of Stock') },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <Dropdown
              value={currentFilter.sort || 'newest'}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              options={[
                { value: 'newest', label: t('Newest First') },
                { value: 'oldest', label: t('Oldest First') },
                { value: 'price-high', label: t('Price: High to Low') },
                { value: 'price-low', label: t('Price: Low to High') },
                { value: 'name-asc', label: t('Name: A to Z') },
                { value: 'name-desc', label: t('Name: Z to A') },
              ]}
            />
          </div>
        </div>

        {Array.isArray(products) && products.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '8px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: 0 }}>
              {t('No products found. Click "Add Product" to create your first product.')}
            </p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>{t('Sr No')}</th>
                  <th className={styles.th}>{t('Image')}</th>
                  <th className={styles.th}>{t('SKU')}</th>
                  <th className={styles.th}>{t('Name')}</th>
                  <th className={styles.th}>{t('Category')}</th>
                  <th className={styles.th}>{t('Brand')}</th>
                  <th className={styles.th}>{t('Price')}</th>
                  <th className={styles.th}>{t('Expiry Date')}</th>
                  <th className={styles.th}>{t('Stock')}</th>
                  <th className={styles.th}>{t('Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(products) && products.map((product, index) => {
                  const isActuallyInStock = product.inStock && product.stock > 0;
                  return (
                    <tr key={product._id}>
                      <td className={styles.td}>{(pagination.page - 1) * (pagination.limit || 10) + index + 1}</td>
                      <td className={styles.td}>
                        {product.image || product.images?.length > 0 ? (
                          <img
                            src={product.image || product.images[0]}
                            alt={product.name}
                            className={styles.productImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              if (parent && !parent.querySelector('.no-image-placeholder')) {
                                const ph = document.createElement('span');
                                ph.className = 'no-image-placeholder';
                                ph.textContent = t('No Image');
                                ph.style.cssText = 'color:#9ca3af;font-size:.75rem;font-style:italic';
                                parent.appendChild(ph);
                              }
                            }}
                          />
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontStyle: 'italic' }}>{t('No Image')}</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b7280', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
                          {product.slug || product._id.substring(0, 8)}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                          {product.name}
                        </div>
                        {product.description && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', lineHeight: '1.4' }}>
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: '999px', background: 'rgba(56,18,48,0.08)', color: '#381230', fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px', border: '1px solid rgba(56,18,48,0.2)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                          {product.category}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: '999px', background: 'rgba(16,185,129,0.08)', color: '#047857', fontSize: '12px', fontWeight: 500, letterSpacing: '0.3px', border: '1px solid rgba(16,185,129,0.2)' }}>
                          {product.brand || '-'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontWeight: '600', color: '#059669', fontSize: '1rem' }}>
                          ₹{Number(product.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: product.expiryDate && new Date(product.expiryDate) < new Date() ? '#b91c1c' : '#4b5563', fontWeight: product.expiryDate && new Date(product.expiryDate) < new Date() ? '600' : '500', fontSize: '0.85rem' }}>
                          {product.expiryDate
                            ? new Date(product.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'N/A'
                          }
                        </span>
                      </td>
                      <td className={styles.td}>
                        {editingStockId === product._id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                              type="number"
                              value={editingStockValue}
                              onChange={(e) => setEditingStockValue(e.target.value)}
                              style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #d1d5db' }}
                              min="0"
                            />
                            <button onClick={() => handleSaveStock(product)} disabled={isSavingStock} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>{t('Save')}</button>
                            <button onClick={handleCancelEdit} disabled={isSavingStock} style={{ background: '#9ca3af', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>{t('Cancel')}</button>
                          </div>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '0.35rem 0.85rem', borderRadius: '6px', backgroundColor: product.stock > 30 ? '#dcfce7' : '#fee2e2', color: product.stock > 30 ? '#166534' : '#b91c1c', fontSize: '0.85rem', fontWeight: '800', minWidth: '60px', textAlign: 'center', fontFamily: 'monospace' }}>
                            {product.stock || 0}
                          </span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {editingStockId !== product._id && (
                          <button onClick={() => handleEditStock(product)} className={styles.editBtn} title={t("Edit Stock")}>
                            <img src={editIcon} alt={t("Edit")} width="20" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          loading={loading || actionLoading.pagination}
          className={styles.paginationContainer}
          btnClassName={styles.paginationBtn}
          infoClassName={styles.paginationInfo}
        />
      </PageLayout>
    </>
  );
};

export default Stocks;