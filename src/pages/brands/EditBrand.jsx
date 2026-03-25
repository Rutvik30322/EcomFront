import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBrands, createBrand, updateBrand } from '../../store/slices/brandSlice';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import styles from './Brands.module.css';
import dashboardStyles from '../dashboard/Dashboard.module.css';
import ImagePreviewModal from '../../components/ui/ImagePreviewModal';
import { useTranslation } from 'react-i18next';

const EditBrand = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const dispatch = useDispatch();
    const { items: brands, loading } = useSelector(state => state.brands);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [formData, setFormData] = useState({
        brandName: '',
        brandImage: '',
        countryOfOrigin: '',
        isActive: true,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    const isEditMode = id && id !== 'new';

    useEffect(() => {
        dispatch(fetchBrands({}));
    }, [dispatch]);

    useEffect(() => {
        if (isEditMode && brands.length > 0) {
            const brand = brands.find(b => b._id === id);
            if (brand) {
                setFormData({
                    brandName: brand.brandName || '',
                    brandImage: brand.brandImage || '',
                    countryOfOrigin: brand.countryOfOrigin || '',
                    isActive: typeof brand.isActive !== 'undefined' ? brand.isActive : true,
                });
            }
        } else if (!isEditMode) {
            setFormData({
                brandName: '',
                brandImage: '',
                countryOfOrigin: '',
                isActive: true,
            });
        }
    }, [id, brands, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                brandImage: file
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const brandData = new FormData();
            brandData.append('brandName', formData.brandName);

            if (formData.brandImage instanceof File) {
                brandData.append('brandImage', formData.brandImage);
            }

            brandData.append('countryOfOrigin', formData.countryOfOrigin);
            brandData.append('isActive', formData.isActive);

            if (isEditMode) {
                await dispatch(updateBrand({ id, brandData }));
            } else {
                await dispatch(createBrand(brandData));
            }

            navigate('/brands');
        } catch (error) {
            console.error('Error saving brand:', error);
            alert('Error saving brand: ' + (error.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || (isEditMode && brands.length === 0)) {
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
                message={isEditMode ? t('Updating brand...') : t('Creating brand...')}
            />
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`${dashboardStyles.mainContent} ${!sidebarOpen ? dashboardStyles.mainContentExpanded : ''}`}>
                <Header
                    title={isEditMode ? t('Edit Brand') : t('Add New Brand')}
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                <div className={dashboardStyles.dashboardContent}>
                    <div className={styles.formPageContainer}>
                        <button
                            className={styles.backButton}
                            onClick={() => navigate('/brands')}
                        >
                            {t('← Back to Brands')}
                        </button>

                        <div className={styles.formContainer}>
                            <h2 className={styles.formTitle}>
                                {isEditMode ? t('Edit Brand') : t('Add New Brand')}
                            </h2>

                            <form onSubmit={handleSubmit} className={styles.categoryForm}>
                                <div className={styles.formSection}>
                                    <h3 className={styles.sectionTitle}>{t('Basic Information')}</h3>
                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor="brandName">{t('Brand Name *')}</label>
                                            <input
                                                type="text"
                                                id="brandName"
                                                name="brandName"
                                                value={formData.brandName}
                                                onChange={handleInputChange}
                                                required
                                                placeholder={t("e.g., Nestle, Cadbury")}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.formSection}>
                                    <h3 className={styles.sectionTitle}>{t('Image Options')}</h3>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="brandImage">{t('Brand Image')}</label>
                                        <input
                                            type="file"
                                            id="brandImage"
                                            name="brandImage"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        {formData.brandImage && (
                                            <div style={{ marginTop: '1rem', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '8px', display: 'inline-block', backgroundColor: '#f9fafb' }}>
                                                <img
                                                    src={typeof formData.brandImage === 'string' ? formData.brandImage : URL.createObjectURL(formData.brandImage)}
                                                    alt="Brand Preview"
                                                    style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                                    onClick={() => setPreviewImage(typeof formData.brandImage === 'string' ? formData.brandImage : URL.createObjectURL(formData.brandImage))}
                                                />
                                                <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                                                    <button type="button" onClick={() => setFormData(p => ({ ...p, brandImage: '' }))} style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>{t('Remove')}</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.formSection}>
                                    <h3 className={styles.sectionTitle}>{t('More Info')}</h3>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="countryOfOrigin">{t('Country of Origin')}</label>
                                        <input
                                            type="text"
                                            id="countryOfOrigin"
                                            name="countryOfOrigin"
                                            value={formData.countryOfOrigin}
                                            onChange={handleInputChange}
                                            placeholder={t("e.g., Switzerland")}
                                        />
                                    </div>
                                </div>

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
                                            <span>{t('Brand is active (will be visible in product selection)')}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className={styles.formActions}>
                                    <button
                                        type="button"
                                        className={styles.cancelBtn}
                                        onClick={() => navigate('/brands')}
                                    >
                                        {t('Cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.saveBtn}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? t('Saving...') : (isEditMode ? t('Update Brand') : t('Save Brand'))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
        </div>
    );
};

export default EditBrand;
