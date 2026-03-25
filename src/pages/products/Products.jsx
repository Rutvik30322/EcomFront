import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, deleteProduct, setCurrentFilter } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchBrands } from '../../store/slices/brandSlice';
import { useSocket } from '../../contexts/SocketContext';
import { useTranslation } from 'react-i18next';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Dropdown from '../../components/ui/Dropdown';
import styles from './Products.module.css';
import editIcon from "../../assets/svg/edit.svg";
import deleteIcon from "../../assets/svg/delete.svg";
import addIcon from "../../assets/svg/add.svg";

const Products = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: products, loading, error, pagination, currentFilter } = useSelector(state => state.products);
  const { items: categories } = useSelector(state => state.categories);
  const { items: brands } = useSelector(state => state.brands);
  const { onDataUpdate } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState({ delete: false, pagination: false });

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

  const handleEdit = (p) => navigate(`/products/edit/${p._id}`);
  const handleDelete = (p) => { setProductToDelete(p); setShowDeleteModal(true); };
  const cancelDelete = () => { setShowDeleteModal(false); setProductToDelete(null); };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setActionLoading(prev => ({ ...prev, delete: true }));
      await dispatch(deleteProduct(productToDelete._id));
      await dispatch(fetchProducts(currentFilter));
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      alert('Failed to delete product: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

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

  return (
    <>
      <PageLayout
        title={t("Product Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.delete || actionLoading.pagination}
        loadingMessage={
          actionLoading.delete ? t('Deleting product...') :
            actionLoading.pagination ? t('Loading page...') : t('Loading products...')
        }
      >
        <RefreshBanner show={loading && products.length > 0} label="products" />

        <div className={styles.productsHeader}>
          <h2 className={styles.productsTitle}>{t('All Products')}</h2>
          <Button leftIcon={<img src={addIcon} alt="" width="22" />}
            onClick={() => navigate('/products/add')}>
            {t('Add Product')}
          </Button>
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
                  <th className={styles.th}>{t('Stock')}</th>
                  <th className={styles.th}>{t('In Stock')}</th>
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
                        <span style={{ display: 'inline-block', padding: '0.35rem 0.85rem', borderRadius: '6px', backgroundColor: product.stock > 10 ? '#dcfce7' : product.stock > 0 ? '#fef3c7' : '#fee2e2', color: product.stock > 10 ? '#166534' : product.stock > 0 ? '#92400e' : '#991b1b', fontSize: '0.85rem', fontWeight: '600', minWidth: '60px', textAlign: 'center', fontFamily: 'monospace' }}>
                          {product.stock || 0}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '6px', backgroundColor: isActuallyInStock ? '#dcfce7' : '#fee2e2', color: isActuallyInStock ? '#166534' : '#991b1b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>
                          {isActuallyInStock ? t('Yes') : t('No')}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button className={styles.editBtn} onClick={() => handleEdit(product)} disabled={loading || actionLoading.delete} title="Edit">
                          <img src={editIcon} alt="Edit" width="25" />
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleDelete(product)} disabled={loading || actionLoading.delete} title="Delete">
                          <img src={deleteIcon} alt="Delete" width="25" />
                        </button>
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

      <DeleteConfirmationModal
        show={showDeleteModal}
        title={t("Delete Product")}
        message={t("Are you sure you want to delete this product?")}
        itemName={productToDelete?.name}
        itemDetails={productToDelete ? [
          { label: t('SKU / ID'), value: productToDelete.slug || productToDelete._id.substring(0, 8) },
          { label: t('Category'), value: productToDelete.category || 'N/A' },
          { label: t('Price'), value: `₹${Number(productToDelete.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        ] : []}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={actionLoading.delete}
        confirmText={t("Delete Product")}
        cancelText={t("Cancel")}
      />
    </>
  );
};

export default Products;