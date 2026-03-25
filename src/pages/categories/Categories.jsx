import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  clearError
} from '../../store/slices/categorySlice';
import { categoryService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import Button from '../../components/ui/Button';
import Dropdown from '../../components/ui/Dropdown';
import styles from './Categories.module.css';
import editIcon from "../../assets/svg/edit.svg";
import deleteIcon from "../../assets/svg/delete.svg";
import addIcon from "../../assets/svg/add.svg";
import toggleoff from "../../assets/svg/toggle_off.svg";
import toggleon from "../../assets/svg/toggle_on.svg";
import importIcon from "../../assets/svg/import.svg";
import { useTranslation } from 'react-i18next';

const Categories = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: categories, loading, error, currentFilter } = useSelector(state => state.categories);
  const { onDataUpdate } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [showPdfImportModal, setShowPdfImportModal] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedCategories, setExtractedCategories] = useState([]);
  const [extractedProducts, setExtractedProducts] = useState([]);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [actionLoading, setActionLoading] = useState({
    delete: false,
    import: false,
    createProducts: false,
    toggleStatus: false
  });
  const [createProductsMode, setCreateProductsMode] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {

        await dispatch(fetchCategories(false)).unwrap();
      } catch (error) {

        if (error === 'Duplicate request prevented' || error?.includes?.('Duplicate request prevented')) {
          setTimeout(() => {
            dispatch(fetchCategories(false));
          }, 500);
        }
      }
    };

    loadCategories();
  }, [dispatch]);

  useEffect(() => {
    if (!onDataUpdate) return;

    const unsubscribe = onDataUpdate('categories', (action, payload) => {

      dispatch(fetchCategories(false));
    });

    return unsubscribe;
  }, [onDataUpdate, dispatch]);

  const filteredCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    if (statusFilter === 'all') return categories;
    if (statusFilter === 'active') return categories.filter(cat => cat.isActive);
    if (statusFilter === 'inactive') return categories.filter(cat => !cat.isActive);
    return categories;
  }, [categories, statusFilter]);

  useEffect(() => { setCurrentPage(1); }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
  const pagedCategories = filteredCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const handleEdit = (category) => {
    if (!category) return;
    navigate(`/categories/edit/${category._id}`);
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        setActionLoading(prev => ({ ...prev, delete: true }));
        await dispatch(deleteCategory(categoryToDelete._id));

        await dispatch(fetchCategories(true));
        setShowDeleteModal(false);
        setCategoryToDelete(null);
      } catch (error) {

        if (error.payload && error.payload !== 'Duplicate request prevented' && !error.payload.includes('Duplicate request prevented')) {
          console.error('Error deleting category:', error);
          alert(error.payload);
        }
      } finally {
        setActionLoading(prev => ({ ...prev, delete: false }));
      }
    }
  };

  const handleToggleStatus = async (categoryId, categoryData) => {
    try {
      setActionLoading(prev => ({ ...prev, toggleStatus: true }));
      const updatedCategory = {
        categoryData,
        isActive: !categoryData.isActive,  // 🔥 toggle here
      };
      await dispatch(updateCategory({
        id: categoryId,
        categoryData: updatedCategory
      }));

    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('Failed to update admin status: ' + (error?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, toggleStatus: false }));
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const extractCategoryNames = (text) => {

    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    const categories = [];

    for (const line of lines) {

      let categoryName = line
        .replace(/^\d+[\.\)]\s*/, '') // Remove numbering like "1. " or "1) "
        .replace(/^[•\-\*]\s*/, '') // Remove bullet points
        .replace(/^Category\s*:\s*/i, '') // Remove "Category: " prefix
        .trim();

      if (categoryName.length >= 2 && categoryName.length <= 50) {

        const skipWords = ['page', 'table of contents', 'index', 'contents', 'introduction', 'summary'];
        const lowerName = categoryName.toLowerCase();
        if (!skipWords.some(word => lowerName.includes(word))) {
          categories.push(categoryName);
        }
      }
    }

    const uniqueCategories = Array.from(new Set(categories));

    return uniqueCategories;
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }

    setPdfFile(file);
    setParsingPdf(true);
    setExtractedCategories([]);
    setExtractedProducts([]);

    try {

      const response = await categoryService.parsePdfForCategories(file);
      const extractedCategoriesData = response.data?.data?.categories || [];
      const extractedProductsData = response.data?.data?.products || [];
      const productCount = response.data?.data?.productCount || 0;
      const usedAI = response.data?.data?.usedAI || false;

      if (extractedCategoriesData.length === 0) {
        alert(`No categories could be extracted from the PDF.\n\nFound ${productCount} product(s) but couldn't determine categories.`);
      } else {
        setExtractedCategories(extractedCategoriesData.map(cat => ({
          ...cat,
          aiGenerated: usedAI
        })));
        setExtractedProducts(extractedProductsData);
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      let errorMessage = 'Error parsing PDF: ';

      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error. Please try again.';
      }

      alert(errorMessage);
    } finally {
      setParsingPdf(false);
    }
  };

  const handleCreateProductsFromPdf = async () => {
    if (!pdfFile) {
      alert('Please upload a PDF file first');
      return;
    }

    setActionLoading(prev => ({ ...prev, createProducts: true }));

    try {
      const response = await categoryService.parsePdfAndCreateProducts(pdfFile);
      const result = response.data?.data || {};

      const categoriesCreated = result.categoriesCreated || 0;
      const productsCreated = result.productsCreated || 0;
      const productsSkipped = result.productsSkipped || 0;
      const productsFailed = result.productsFailed || 0;
      const usedAI = result.usedAI || false;

      let message = `✅ Products Created Successfully!\n\n`;
      message += `📦 Categories Created: ${categoriesCreated}\n`;
      message += `🛍️ Products Created: ${productsCreated}\n`;

      if (productsSkipped > 0) {
        message += `⏭️ Products Skipped (already exist): ${productsSkipped}\n`;
      }
      if (productsFailed > 0) {
        message += `❌ Products Failed: ${productsFailed}\n`;
      }

      message += `\n${usedAI ? '🤖 AI was used to generate product details.' : '📋 Keyword matching was used.'}`;

      if (result.skipped && result.skipped.length > 0) {
        message += `\n\nSkipped Products:\n`;
        result.skipped.slice(0, 5).forEach(item => {
          message += `- ${item.name}\n`;
        });
        if (result.skipped.length > 5) {
          message += `... and ${result.skipped.length - 5} more\n`;
        }
      }

      if (result.failed && result.failed.length > 0) {
        message += `\n\nFailed Products:\n`;
        result.failed.forEach(item => {
          message += `- ${item.name}: ${item.error}\n`;
        });
      }

      alert(message);

      await dispatch(fetchCategories(false));

      setShowPdfImportModal(false);
      setPdfFile(null);
      setExtractedCategories([]);
      setExtractedProducts([]);
      setCreateProductsMode(false);
    } catch (error) {
      console.error('Error creating products:', error);
      let errorMessage = 'Error creating products: ';

      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error. Please try again.';
      }

      alert(errorMessage);
    } finally {
      setActionLoading(prev => ({ ...prev, createProducts: false }));
    }
  };

  const handleImportCategories = async () => {
    if (extractedCategories.length === 0) {
      alert('No categories to import');
      return;
    }

    setActionLoading(prev => ({ ...prev, import: true }));

    try {
      const results = {
        success: [],
        skipped: [],
        failed: [],
      };

      const existingCategoriesResponse = await categoryService.getAllCategories(false);
      const existingCategoryNames = new Set(
        (existingCategoriesResponse.data?.data?.categories || []).map(cat => cat.name.toLowerCase().trim())
      );

      for (const category of extractedCategories) {
        const categoryNameLower = category.name.toLowerCase().trim();

        if (existingCategoryNames.has(categoryNameLower)) {
          results.skipped.push({ name: category.name, reason: 'Already exists' });
          continue;
        }

        try {
          await categoryService.createCategory(category);
          results.success.push(category.name);

          existingCategoryNames.add(categoryNameLower);
        } catch (error) {

          if (error.response?.status === 400 ||
            error.response?.data?.message?.includes('already exists') ||
            error.response?.data?.message?.includes('duplicate')) {
            results.skipped.push({ name: category.name, reason: 'Already exists' });
          } else {
            results.failed.push({ name: category.name, reason: error.response?.data?.message || 'Unknown error' });
          }
        }
      }

      let message = `Import completed!\n\n`;
      message += `✅ Successfully imported: ${results.success.length}\n`;
      if (results.skipped.length > 0) {
        message += `⏭️ Skipped (already exist): ${results.skipped.length}\n`;
      }
      if (results.failed.length > 0) {
        message += `❌ Failed: ${results.failed.length}\n`;
      }

      if (results.skipped.length > 0 || results.failed.length > 0) {
        message += `\nDetails:\n`;
        if (results.skipped.length > 0) {
          message += `\nSkipped:\n`;
          results.skipped.slice(0, 10).forEach(item => {
            message += `- ${item.name}\n`;
          });
          if (results.skipped.length > 10) {
            message += `... and ${results.skipped.length - 10} more\n`;
          }
        }
        if (results.failed.length > 0) {
          message += `\nFailed:\n`;
          results.failed.forEach(item => {
            message += `- ${item.name}: ${item.reason}\n`;
          });
        }
      }
      alert(message);

      await dispatch(fetchCategories(false));

      setShowPdfImportModal(false);
      setPdfFile(null);
      setExtractedCategories([]);
      setExtractedProducts([]);
    } catch (error) {
      console.error('Error importing categories:', error);
      alert('Error importing categories: ' + (error.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, import: false }));
    }
  };

  return (
    <>
      <PageLayout
        title={t("Category Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.delete || actionLoading.import || actionLoading.createProducts || parsingPdf}
        loadingMessage={
          parsingPdf ? t('Parsing PDF...') :
            actionLoading.createProducts ? t('Creating products with AI... This may take a few minutes...') :
              actionLoading.import ? t('Importing categories...') :
                actionLoading.delete ? t('Deleting category...') : t('Loading categories...')
        }
      >
        <RefreshBanner show={loading && categories.length > 0} label="categories" />
        {error && error !== 'Duplicate request prevented' && !error.includes('Duplicate request prevented') && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => dispatch(clearError())} aria-label="Close error">✕</button>
          </div>
        )}

        <div className={styles.categoriesHeader}>
          <h2 className={styles.categoriesTitle}>{t('All Categories')}</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              leftIcon={<img src={importIcon} alt="" width="20" />}
              onClick={() => setShowPdfImportModal(true)}>
              {t('Import from PDF')}
            </Button>
            <Button leftIcon={<img src={addIcon} alt="" width="20" />}
              onClick={() => navigate('/categories/add')}>
              {t('Add Category')}
            </Button>
          </div>
        </div>

        { }
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <Dropdown
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: t('All Categories') },
                { value: 'active', label: t('Active Only') },
                { value: 'inactive', label: t('Inactive Only') },
              ]}
            />
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🏷️</div>
            <div className={styles.emptyStateText}>{t('No categories found')}</div>
            <div className={styles.emptyStateSubtext}>
              {statusFilter !== 'all'
                ? (statusFilter === 'active' ? t('No active categories found.') : t('No inactive categories found.'))
                : t('Add your first category to get started!')}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>{t('Sr No')}</th>
                    <th className={styles.th}>{t('Icon')}</th>
                    <th className={styles.th}>{t('Name')}</th>
                    <th className={styles.th}>{t('Description')}</th>
                    <th className={styles.th}>{t('Products')}</th>
                    <th className={styles.th}>{t('Status')}</th>
                    <th className={styles.th} style={{ textAlign: 'center' }}>{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCategories.map((category, index) => (
                    <tr key={category._id}>
                      <td className={styles.td}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className={styles.td} style={{ fontSize: '1.6rem', textAlign: 'center' }}>
                        {category.icon || '🍫'}
                      </td>
                      <td className={`${styles.td} ${styles.nameCell}`}>
                        <strong>{category.name}</strong>
                      </td>
                      <td className={`${styles.td} ${styles.descriptionCell}`} title={category.description || ''}>
                        {category.description || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{t('No description')}</span>}
                      </td>
                      <td className={styles.td}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          background: category.productCount > 0 ? '#dbeafe' : '#f3f4f6',
                          color: category.productCount > 0 ? '#1e40af' : '#6b7280',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {category.productCount !== undefined ? category.productCount : 0}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${category.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {category.isActive ? t('Active') : t('Inactive')}
                        </span>
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleEdit(category)}
                          disabled={loading || actionLoading.delete}
                        >
                          <img src={editIcon} alt="Edit" width="25" />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${category.isActive ? styles.toggleBtn : styles.toggleBtnActive}`}
                          onClick={() => handleToggleStatus(category._id, category)}
                          disabled={loading || actionLoading.delete || actionLoading.toggleStatus}
                        >
                          {actionLoading.toggleStatus ? t('Updating...') : <img
                            src={category.isActive ? toggleon : toggleoff}
                            alt="toggle"
                            width={28}
                          />}

                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(category)}
                          disabled={loading || actionLoading.delete}
                        >
                          <img src={deleteIcon} alt="Edit" width="25" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={{ page: currentPage, pages: totalPages, total: filteredCategories.length }}
              onPageChange={handlePageChange}
              className={styles.paginationContainer}
              btnClassName={styles.paginationBtn}
              infoClassName={styles.paginationInfo}
            />
          </>
        )}
      </PageLayout>

      { }
      < DeleteConfirmationModal
        show={showDeleteModal}
        title={t("Delete Category")}
        message={t("Are you sure you want to delete this category? Products using this category will need to be updated first.")}
        itemName={categoryToDelete?.name}
        itemDetails={
          categoryToDelete ? [
            { label: t('Icon'), value: categoryToDelete.icon || '🍫' },
            { label: t('Status'), value: categoryToDelete.isActive ? t('Active') : t('Inactive') },
          ] : []
        }
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={actionLoading.delete}
        confirmText={t("Delete Category")}
        cancelText={t("Cancel")}
      />

      { }
      {
        showPdfImportModal && (
          <div className={styles.modalOverlay} onClick={() => !parsingPdf && !actionLoading.import && setShowPdfImportModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {createProductsMode ? t('Create Products from PDF') : t('Import Categories from PDF')}
                </h3>
                <button
                  className={styles.modalCloseBtn}
                  onClick={() => {
                    if (!parsingPdf && !actionLoading.import && !actionLoading.createProducts) {
                      setShowPdfImportModal(false);
                      setPdfFile(null);
                      setExtractedCategories([]);
                      setExtractedProducts([]);
                      setCreateProductsMode(false);
                    }
                  }}
                  disabled={parsingPdf || actionLoading.import || actionLoading.createProducts}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.pdfUploadSection}>
                  <label className={styles.fileInputLabel}>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={parsingPdf || actionLoading.import}
                      style={{ display: 'none' }}
                    />
                    <span className={styles.fileInputButton}>
                      {parsingPdf ? t('Parsing PDF...') : pdfFile ? pdfFile.name : t('📄 Choose PDF File')}
                    </span>
                  </label>
                  {pdfFile && !parsingPdf && (
                    <p className={styles.fileInfo}>{t('Selected: ')}{pdfFile.name}</p>
                  )}
                </div>

                {extractedProducts.length > 0 && (
                  <div className={styles.extractedProductsSection} style={{ marginBottom: '1.5rem' }}>
                    <h4 className={styles.sectionTitle}>
                      {t('Found {{count}} Product(s):', { count: extractedProducts.length })}
                    </h4>
                    <div className={styles.productsPreview} style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.85rem', color: '#6b7280' }}>
                      {extractedProducts.slice(0, 10).map((product, index) => (
                        <div key={index} style={{ padding: '0.25rem 0', borderBottom: '1px solid #e5e7eb' }}>
                          {index + 1}. {product}
                        </div>
                      ))}
                      {extractedProducts.length > 10 && (
                        <div style={{ padding: '0.5rem 0', fontStyle: 'italic', color: '#9ca3af' }}>
                          {t('... and {{count}} more products', { count: extractedProducts.length - 10 })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {extractedCategories.length > 0 && (
                  <div className={styles.extractedCategoriesSection}>
                    <h4 className={styles.sectionTitle}>
                      {t('Intelligently Extracted {{count}} Category/Categories:', { count: extractedCategories.length })}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                      {extractedCategories[0]?.aiGenerated
                        ? t('🤖 Categories were created using AI analysis of product names.')
                        : t('📋 Categories were created by analyzing product names using keyword matching.')}
                    </p>
                    <div className={styles.categoriesPreview}>
                      {extractedCategories.map((category, index) => (
                        <div key={index} className={styles.categoryPreviewItem}>
                          <span className={styles.categoryIcon}>{category.icon}</span>
                          <span className={styles.categoryName}>{category.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extractedCategories.length === 0 && !parsingPdf && pdfFile && (
                  <p className={styles.noCategoriesMessage}>
                    {t('No categories found in the PDF. Please ensure the PDF contains category names (one per line or numbered list).')}
                  </p>
                )}
              </div>
              <div className={styles.modalActions}>
                {!createProductsMode ? (
                  <>
                    <button
                      className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                      onClick={handleImportCategories}
                      disabled={extractedCategories.length === 0 || parsingPdf || actionLoading.import}
                    >
                      {actionLoading.import ? (
                        <>
                          <span className={styles.spinner}></span> {t('Importing...')}
                        </>
                      ) : (
                        t('Import {{count}} Categories', { count: extractedCategories.length })
                      )}
                    </button>
                    {extractedProducts.length > 0 && (
                      <button
                        className={`${styles.modalBtn}`}
                        style={{ backgroundColor: '#10b981', color: 'white' }}
                        onClick={handleCreateProductsFromPdf}
                        disabled={!pdfFile || parsingPdf || actionLoading.createProducts || actionLoading.import}
                      >
                        {actionLoading.createProducts ? (
                          <>
                            <span className={styles.spinner}></span> {t('Creating Products...')}
                          </>
                        ) : (
                          t('🚀 Create {{count}} Products with AI', { count: extractedProducts.length })
                        )}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                    onClick={handleCreateProductsFromPdf}
                    disabled={!pdfFile || parsingPdf || actionLoading.createProducts}
                  >
                    {actionLoading.createProducts ? (
                      <>
                        <span className={styles.spinner}></span> {t('Creating Products with AI...')}
                      </>
                    ) : (
                      t('🚀 Create Products from PDF')
                    )}
                  </button>
                )}
                <button
                  className={`${styles.modalBtn} ${styles.modalBtnSecondary}`}
                  onClick={() => {
                    if (!parsingPdf && !actionLoading.import && !actionLoading.createProducts) {
                      setShowPdfImportModal(false);
                      setPdfFile(null);
                      setExtractedCategories([]);
                      setExtractedProducts([]);
                      setCreateProductsMode(false);
                    }
                  }}
                  disabled={parsingPdf || actionLoading.import || actionLoading.createProducts}
                >
                  {t('Cancel')}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default Categories;
