import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
    fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    clearError
} from '../../store/slices/brandSlice';
import { brandService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import Button from '../../components/ui/Button';
import Dropdown from '../../components/ui/Dropdown';
import styles from './Brands.module.css';
import editIcon from "../../assets/svg/edit.svg";
import deleteIcon from "../../assets/svg/delete.svg";
import addIcon from "../../assets/svg/add.svg";
import toggleoff from "../../assets/svg/toggle_off.svg";
import toggleon from "../../assets/svg/toggle_on.svg";
import { useTranslation } from 'react-i18next';
import ImagePreviewModal from '../../components/ui/ImagePreviewModal';

const Brands = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { items: brands, loading, error, currentFilter } = useSelector(state => state.brands);
    const { onDataUpdate } = useSocket();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [brandToDelete, setBrandToDelete] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [actionLoading, setActionLoading] = useState({
        delete: false,
        toggleStatus: false
    });

    useEffect(() => {
        const loadBrands = async () => {
            try {
                await dispatch(fetchBrands({})).unwrap();
            } catch (error) {
                if (error === 'Duplicate request prevented' || error?.includes?.('Duplicate request prevented')) {
                    setTimeout(() => {
                        dispatch(fetchBrands({}));
                    }, 500);
                }
            }
        };

        loadBrands();
    }, [dispatch]);

    useEffect(() => {
        if (!onDataUpdate) return;
        const unsubscribe = onDataUpdate('brands', (action, payload) => {
            dispatch(fetchBrands({}));
        });
        return unsubscribe;
    }, [onDataUpdate, dispatch]);

    const filteredBrands = useMemo(() => {
        if (!Array.isArray(brands)) return [];
        if (statusFilter === 'all') return brands;
        if (statusFilter === 'active') return brands.filter(brand => brand.isActive);
        if (statusFilter === 'inactive') return brands.filter(brand => !brand.isActive);
        return brands;
    }, [brands, statusFilter]);

    useEffect(() => { setCurrentPage(1); }, [statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredBrands.length / ITEMS_PER_PAGE));
    const pagedBrands = filteredBrands.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleEdit = (brand) => {
        if (!brand) return;
        navigate(`/brands/edit/${brand._id}`);
    };

    const handleDelete = (brand) => {
        setBrandToDelete(brand);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (brandToDelete) {
            try {
                setActionLoading(prev => ({ ...prev, delete: true }));
                await dispatch(deleteBrand(brandToDelete._id));

                await dispatch(fetchBrands({}));
                setShowDeleteModal(false);
                setBrandToDelete(null);
            } catch (error) {
                if (error.payload && error.payload !== 'Duplicate request prevented' && !error.payload.includes('Duplicate request prevented')) {
                    console.error('Error deleting brand:', error);
                    alert(error.payload);
                }
            } finally {
                setActionLoading(prev => ({ ...prev, delete: false }));
            }
        }
    };

    const handleToggleStatus = async (brandId, brandData) => {
        try {
            setActionLoading(prev => ({ ...prev, toggleStatus: true }));
            const updatedBrand = {
                ...brandData,
                isActive: !brandData.isActive,
            };
            await dispatch(updateBrand({
                id: brandId,
                brandData: updatedBrand
            }));

        } catch (error) {
            console.error('Error toggling brand status:', error);
            alert('Failed to update brand status: ' + (error?.message || 'Unknown error'));
        } finally {
            setActionLoading(prev => ({ ...prev, toggleStatus: false }));
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setBrandToDelete(null);
    };

    return (
        <>
            <PageLayout
                title={t("Brand Management")}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                loading={loading || actionLoading.delete || actionLoading.toggleStatus}
                loadingMessage={
                    actionLoading.delete ? t('Deleting brand...') : t('Loading brands...')
                }
            >
                <RefreshBanner show={loading && brands.length > 0} label="brands" />
                {error && error !== 'Duplicate request prevented' && !error.includes('Duplicate request prevented') && (
                    <div className={styles.errorAlert}>
                        <span>{error}</span>
                        <button onClick={() => dispatch(clearError())} aria-label="Close error">✕</button>
                    </div>
                )}

                <div className={styles.brandsHeader}>
                    <h2 className={styles.brandsTitle}>{t('All Brands')}</h2>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Button leftIcon={<img src={addIcon} alt="" width="20" />}
                            onClick={() => navigate('/brands/add')}>
                            {t('Add Brand')}
                        </Button>
                    </div>
                </div>

                <div className={styles.filtersContainer}>
                    <div className={styles.filterGroup}>
                        <Dropdown
                            id="statusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: 'all', label: t('All Brands') },
                                { value: 'active', label: t('Active Only') },
                                { value: 'inactive', label: t('Inactive Only') },
                            ]}
                        />
                    </div>
                </div>

                {filteredBrands.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>🏷️</div>
                        <div className={styles.emptyStateText}>{t('No brands found')}</div>
                        <div className={styles.emptyStateSubtext}>
                            {statusFilter !== 'all'
                                ? (statusFilter === 'active' ? t('No active brands found.') : t('No inactive brands found.'))
                                : t('Add your first brand to get started!')}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th className={styles.th}>{t('Sr No')}</th>
                                        { }
                                        <th className={styles.th} style={{ textAlign: 'center' }}>{t('Image')}</th>
                                        <th className={styles.th}>{t('Name')}</th>
                                        <th className={styles.th}>{t('Country Of Origin')}</th>
                                        <th className={styles.th}>{t('Status')}</th>
                                        <th className={styles.th} style={{ textAlign: 'center' }}>{t('Actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedBrands.map((brand, index) => (
                                        <tr key={brand._id}>
                                            <td className={styles.td}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                            { }
                                            <td className={styles.td} style={{ textAlign: 'center' }}>
                                                {brand.brandImage ? (
                                                    <img
                                                        src={brand.brandImage}
                                                        alt={brand.brandName}
                                                        style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', cursor: 'pointer' }}
                                                        onClick={() => setPreviewImage(brand.brandImage)}
                                                    />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', backgroundColor: '#f3f4f6', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#9ca3af', fontSize: '12px' }}>no img</div>
                                                )}
                                            </td>
                                            <td className={`${styles.td} ${styles.nameCell}`}>
                                                <strong>{brand.brandName}</strong>
                                            </td>
                                            <td className={`${styles.td} ${styles.descriptionCell}`} title={brand.countryOfOrigin || ''}>
                                                {brand.countryOfOrigin || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>{t('No origin specified')}</span>}
                                            </td>
                                            <td className={styles.td}>
                                                <span className={`${styles.statusBadge} ${brand.isActive ? styles.statusActive : styles.statusInactive}`}>
                                                    {brand.isActive ? t('Active') : t('Inactive')}
                                                </span>
                                            </td>
                                            <td className={styles.actionsCell}>
                                                <button
                                                    className={styles.editBtn}
                                                    onClick={() => handleEdit(brand)}
                                                    disabled={loading || actionLoading.delete}
                                                >
                                                    <img src={editIcon} alt="Edit" width="25" />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${brand.isActive ? styles.toggleBtn : styles.toggleBtnActive}`}
                                                    onClick={() => handleToggleStatus(brand._id, brand)}
                                                    disabled={loading || actionLoading.delete || actionLoading.toggleStatus}
                                                >
                                                    {actionLoading.toggleStatus ? t('Updating...') : <img
                                                        src={brand.isActive ? toggleon : toggleoff}
                                                        alt="toggle"
                                                        width={28}
                                                    />}

                                                </button>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDelete(brand)}
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
                            pagination={{ page: currentPage, pages: totalPages, total: filteredBrands.length }}
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
                title={t("Delete Brand")}
                message={t("Are you sure you want to delete this brand? Products using this brand will need to be updated first.")}
                itemName={brandToDelete?.brandName}
                itemDetails={
                    brandToDelete ? [
                        { label: t('Origin'), value: brandToDelete.countryOfOrigin || '' },
                        { label: t('Status'), value: brandToDelete.isActive ? t('Active') : t('Inactive') },
                    ] : []
                }
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                loading={actionLoading.delete}
                confirmText={t("Delete Brand")}
                cancelText={t("Cancel")}
            />

            <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
        </>
    );
};

export default Brands;
