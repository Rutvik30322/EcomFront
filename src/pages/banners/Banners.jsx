import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bannerService, uploadService } from '../../services/api';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import Button from '../../components/ui/Button';
import styles from './Banners.module.css';
import deleteIcon from "../../assets/svg/delete.svg";
import editIcon from "../../assets/svg/edit.svg";
import toggleoff from "../../assets/svg/toggle_off.svg";
import toggleon from "../../assets/svg/toggle_on.svg";
import addIcon from "../../assets/svg/add.svg";
import { useTranslation } from 'react-i18next';

const Banners = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    offer: '',
    link: '',
    order: 0,
    isActive: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    save: false,
    delete: false,
    toggleStatus: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.max(1, Math.ceil(banners.length / ITEMS_PER_PAGE));
  const pagedBanners = banners.slice(
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

  useEffect(() => {
    const loadBannersData = async () => {
      try {
        await loadBanners();
      } catch (error) {

        if (error === 'Duplicate request prevented' || error?.message?.includes?.('Duplicate request prevented')) {
          setTimeout(() => {
            loadBanners();
          }, 500);
        }
      }
    };

    loadBannersData();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = await bannerService.getAllBanners({ active: 'false' });
      if (response.data && response.data.data && response.data.data.banners) {
        setBanners(response.data.data.banners);
      } else if (response.data && response.data.banners) {
        setBanners(response.data.banners);
      }
    } catch (error) {

      if (error === 'Duplicate request prevented' || error?.message?.includes?.('Duplicate request prevented')) {

        return;
      }
      console.error('Error loading banners:', error);

      if (error.response?.data?.message || (error.message && !error.message.includes('Duplicate request prevented'))) {
        alert('Error loading banners: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('images', file);

      const response = await uploadService.uploadProductImages([file]);
      if (response.data && response.data.data && response.data.data.imageUrls) {
        const imageUrl = response.data.data.imageUrls[0];
        setFormData(prev => ({ ...prev, image: imageUrl }));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(prev => ({ ...prev, save: true }));
      if (editingBanner) {
        await bannerService.updateBanner(editingBanner._id, formData);
      } else {
        await bannerService.createBanner(formData);
      }

      setShowAddModal(false);
      setEditingBanner(null);
      setFormData({
        title: '',
        description: '',
        image: '',
        offer: '',
        link: '',
        order: 0,
        isActive: true,
      });

      try {
        await loadBanners();
      } catch (retryError) {
        if (retryError === 'Duplicate request prevented' || retryError?.message?.includes?.('Duplicate request prevented')) {
          setTimeout(() => {
            loadBanners();
          }, 500);
        }
      }
    } catch (error) {

      if (error === 'Duplicate request prevented' || error?.message?.includes?.('Duplicate request prevented')) {

        setTimeout(() => {
          loadBanners();
        }, 500);

        setShowAddModal(false);
        setEditingBanner(null);
        return;
      }
      console.error('Error saving banner:', error);
      alert('Error saving banner: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(prev => ({ ...prev, save: false }));
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      description: banner.description || '',
      image: banner.image || '',
      offer: banner.offer || '',
      link: banner.link || '',
      order: banner.order || 0,
      isActive: banner.isActive !== undefined ? banner.isActive : true,
    });
    setShowAddModal(true);
  };

  const handleDelete = (banner) => {
    setBannerToDelete(banner);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (bannerToDelete) {
      try {
        setActionLoading(prev => ({ ...prev, delete: true }));
        await bannerService.deleteBanner(bannerToDelete._id);

        try {
          await loadBanners();
        } catch (retryError) {
          if (retryError === 'Duplicate request prevented' || retryError?.message?.includes?.('Duplicate request prevented')) {
            setTimeout(() => {
              loadBanners();
            }, 500);
          }
        }
        setShowDeleteModal(false);
        setBannerToDelete(null);
      } catch (error) {

        if (error === 'Duplicate request prevented' || error?.message?.includes?.('Duplicate request prevented')) {

          setTimeout(() => {
            loadBanners();
          }, 500);
          return;
        }
        console.error('Error deleting banner:', error);
        alert('Error deleting banner: ' + (error.response?.data?.message || error.message));
      } finally {
        setActionLoading(prev => ({ ...prev, delete: false }));
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setBannerToDelete(null);
  };

  const handleToggleStatus = async (banner) => {
    try {
      setActionLoading(prev => ({ ...prev, toggleStatus: true }));
      await bannerService.updateBanner(banner._id, {
        ...banner,
        isActive: !banner.isActive,
      });

      try {
        await loadBanners();
      } catch (retryError) {
        if (retryError === 'Duplicate request prevented' || retryError?.message?.includes?.('Duplicate request prevented')) {
          setTimeout(() => {
            loadBanners();
          }, 500);
        }
      }
    } catch (error) {

      if (error === 'Duplicate request prevented' || error?.message?.includes?.('Duplicate request prevented')) {

        setTimeout(() => {
          loadBanners();
        }, 500);
        return;
      }
      console.error('Error updating banner status:', error);
      alert('Error updating banner status: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(prev => ({ ...prev, toggleStatus: false }));
    }
  };

  return (
    <>
      <PageLayout
        title={t("Banner Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.save || actionLoading.delete || actionLoading.toggleStatus || uploadingImage}
        loadingMessage={
          uploadingImage ? t('Uploading image...') :
            actionLoading.save ? t('Saving banner...') :
              actionLoading.delete ? t('Deleting banner...') :
                actionLoading.toggleStatus ? t('Updating banner status...') : t('Loading banners...')
        }
      >
        <RefreshBanner show={loading && banners.length > 0} label="banners" />
        <div className={styles.bannersHeader}>
          <h2 className={styles.bannersTitle}>{t('All Banners')}</h2>
          <Button
            leftIcon={<img src={addIcon} alt="" width="22" />}
            onClick={() => {
              setEditingBanner(null);
              setFormData({
                title: '',
                description: '',
                image: '',
                offer: '',
                link: '',
                order: 0,
                isActive: true,
              });
              setShowAddModal(true);
            }}
          >
            {t('Add Banner')}
          </Button>
        </div>

        {banners.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', margin: 0 }}>
              {t('No banners found. Click "Add Banner" to create your first banner.')}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>{t('Sr No')}</th>
                    <th className={styles.th}>{t('Image')}</th>
                    <th className={styles.th}>{t('ID')}</th>
                    <th className={styles.th}>{t('Title')}</th>
                    <th className={styles.th}>{t('Description')}</th>
                    <th className={styles.th}>{t('Offer')}</th>
                    <th className={styles.th}>{t('Order')}</th>
                    { }
                    <th className={styles.th}>{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedBanners.map((banner, index) => (
                    <tr key={banner._id}>
                      <td className={styles.td}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className={styles.td}>
                        {banner.image ? (
                          <img
                            src={banner.image}
                            alt={banner.title}
                            className={styles.bannerImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              if (parent && !parent.querySelector('.no-image-placeholder')) {
                                const placeholder = document.createElement('span');
                                placeholder.className = 'no-image-placeholder';
                                placeholder.textContent = t('No Image');
                                placeholder.style.cssText = 'color: #9ca3af; font-size: 0.75rem; font-style: italic;';
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem', fontStyle: 'italic' }}>{t('No Image')}</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          color: '#6b7280',
                          background: '#f3f4f6',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-block'
                        }}>
                          {banner._id.substring(0, 8)}...
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          fontSize: '0.95rem',
                          marginBottom: '0.25rem'
                        }}>
                          {banner.title}
                        </div>
                      </td>
                      <td className={styles.td}>
                        {banner.description ? (
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px'
                          }}>
                            {banner.description}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem' }}>{t('No description')}</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        {banner.offer ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '0.8rem',
                            fontWeight: '600'
                          }}>
                            {banner.offer}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.85rem' }}>-</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '0.9rem',
                          color: '#374151',
                          fontWeight: '500'
                        }}>
                          {banner.order || 0}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionsCell}>
                          <button
                            className={styles.editBtn}
                            onClick={() => handleEdit(banner)}
                            disabled={loading || actionLoading.save || actionLoading.delete || actionLoading.toggleStatus}
                          >
                            <img src={editIcon} alt="Edit" width="25" />
                          </button>
                          <button
                            className={styles.toggleBtn}
                            onClick={() => handleToggleStatus(banner)}
                            disabled={loading || actionLoading.save || actionLoading.delete || actionLoading.toggleStatus}
                          >
                            {actionLoading.toggleStatus ? t('Updating...') : (
                              <img
                                src={banner.isActive ? toggleon : toggleoff}
                                alt="toggle"
                                width={28}
                              />
                            )}
                          </button>
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(banner)}
                            disabled={loading || actionLoading.save || actionLoading.delete || actionLoading.toggleStatus}
                          >
                            <img src={deleteIcon} alt="Delete" width="25" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={{ page: currentPage, pages: totalPages, total: banners.length }}
              onPageChange={handlePageChange}
              className={styles.paginationContainer}
              btnClassName={styles.paginationBtn}
              infoClassName={styles.paginationInfo}
            />
          </>
        )}
      </PageLayout>

      { }
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingBanner ? t('Edit Banner') : t('Add New Banner')}</h3>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>{t('Title *')}</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('Description')}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('Image *')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('Offer Text')}</label>
                <input
                  type="text"
                  name="offer"
                  value={formData.offer}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('Link / URL')}</label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>{t('Order')}</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                />
              </div>
              <div className={styles.formGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  id="isActive"
                  style={{ width: 'auto', marginBottom: 0 }}
                />
                <label htmlFor="isActive" style={{ marginBottom: 0 }}>{t('Active')}</label>
              </div>
              <div className={styles.modalActions} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>{t('Cancel')}</Button>
                <Button type="submit" disabled={uploadingImage || actionLoading.save}>
                  {actionLoading.save ? t('Saving...') : t('Save Banner')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        show={showDeleteModal}
        title={t("Delete Banner")}
        message={t("Are you sure you want to delete this banner?")}
        itemName={bannerToDelete?.title}
        itemDetails={bannerToDelete ? [
          { label: t('ID'), value: bannerToDelete._id.substring(0, 8) + '...' },
          { label: t('Status'), value: bannerToDelete.isActive ? t('Active') : t('Inactive') },
          { label: t('Order'), value: bannerToDelete.order || 0 },
        ] : []}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={actionLoading.delete}
        confirmText={t("Delete Banner")}
        cancelText={t("Cancel")}
      />
    </>
  );
};

export default Banners;
