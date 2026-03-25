import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCategories, createCategory, updateCategory } from '../../store/slices/categorySlice';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import styles from './Categories.module.css';
import dashboardStyles from '../dashboard/Dashboard.module.css';
import { useTranslation } from 'react-i18next';

const EditCategory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items: categories, loading } = useSelector(state => state.categories);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    icon: '🍫',
    description: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = id && id !== 'new';

  useEffect(() => {
    dispatch(fetchCategories(true));
  }, [dispatch]);

  useEffect(() => {
    if (isEditMode && categories.length > 0) {
      const category = categories.find(c => c._id === id);
      if (category) {
        setFormData({
          name: category.name || '',
          icon: category.icon || '🍫',
          description: category.description || '',
          isActive: typeof category.isActive !== 'undefined' ? category.isActive : true,
        });
      }
    } else if (!isEditMode) {

      setFormData({
        name: '',
        icon: '🍫',
        description: '',
        isActive: true,
      });
    }
  }, [id, categories, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const categoryData = { ...formData };

      if (isEditMode) {
        await dispatch(updateCategory({ id, categoryData }));
      } else {
        await dispatch(createCategory(categoryData));
      }

      navigate('/categories');
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || (isEditMode && categories.length === 0)) {
    return (
      <div className={dashboardStyles.dashboardContainer}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={dashboardStyles.mainContent}>
          <div className={dashboardStyles.loading}>Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={dashboardStyles.dashboardContainer}>
      <LoadingOverlay
        show={isLoading}
        message={isEditMode ? t('Updating category...') : t('Creating category...')}
      />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`${dashboardStyles.mainContent} ${!sidebarOpen ? dashboardStyles.mainContentExpanded : ''}`}>
        <Header
          title={isEditMode ? t('Edit Category') : t('Add New Category')}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className={dashboardStyles.dashboardContent}>
          <div className={styles.formPageContainer}>
            { }
            <button
              className={styles.backButton}
              onClick={() => navigate('/categories')}
            >
              {t('← Back to Categories')}
            </button>

            <div className={styles.formContainer}>
              <h2 className={styles.formTitle}>
                {isEditMode ? t('Edit Category') : t('Add New Category')}
              </h2>

              <form onSubmit={handleSubmit} className={styles.categoryForm}>
                { }
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>{t('Basic Information')}</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name">{t('Name *')}</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder={t("e.g., Bars, Truffles")}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="icon">{t('Icon (Emoji) - Optional')}</label>
                      <div className={styles.iconInputWrapper}>
                        <input
                          type="text"
                          id="icon"
                          name="icon"
                          value={formData.icon}
                          onChange={handleInputChange}
                          maxLength={10}
                          placeholder="🍫"
                        />
                        <span className={styles.iconPreview}>{formData.icon || '🍫'}</span>
                      </div>
                      <small className={styles.helpText}>
                        {t('Enter an emoji for this category (optional, defaults to 🍫).')}
                      </small>
                    </div>
                  </div>
                </div>

                { }
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>{t('Description')}</h3>
                  <div className={styles.formGroup}>
                    <label htmlFor="description">{t('Description')}</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder={t("Brief description of the category")}
                    />
                  </div>
                </div>

                { }
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>{t('Status')}</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <span>{t('Category is active (will be visible in product selection)')}</span>
                    </label>
                  </div>
                </div>

                { }
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => navigate('/categories')}
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? t('Saving...') : (isEditMode ? t('Update Category') : t('Save Category'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditCategory;
