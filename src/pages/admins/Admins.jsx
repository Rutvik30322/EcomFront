import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAdmins,
  deleteAdmin,
  toggleAdminStatus,
  setCurrentFilter,
  clearError
} from '../../store/slices/adminSlice';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Dropdown from '../../components/ui/Dropdown';
import styles from '../users/Users.module.css';
import editIcon from "../../assets/svg/edit.svg";
import deleteIcon from "../../assets/svg/delete.svg";
import addIcon from "../../assets/svg/add.svg";
import toggleoff from "../../assets/svg/toggle_off.svg";
import toggleon from "../../assets/svg/toggle_on.svg";
import { useTranslation } from 'react-i18next';

const Admins = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: admins, loading, error, pagination, currentFilter } = useSelector(state => state.admins);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    delete: false,
    toggleStatus: false,
    pagination: false,
  });

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        await dispatch(fetchAdmins(currentFilter)).unwrap();
      } catch (error) {

        if (error === 'Duplicate request prevented' || error?.includes?.('Duplicate request prevented')) {
          setTimeout(() => {
            dispatch(fetchAdmins(currentFilter));
          }, 500);
        }
      }
    };

    loadAdmins();
  }, [dispatch, currentFilter]);

  const handleEdit = (admin) => {
    if (!admin) return;
    navigate(`/admins/edit/${admin._id}`);
  };

  const handleDelete = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (adminToDelete) {
      try {
        setActionLoading(prev => ({ ...prev, delete: true }));
        await dispatch(deleteAdmin(adminToDelete._id));

        await dispatch(fetchAdmins(currentFilter));
        setShowDeleteModal(false);
        setAdminToDelete(null);
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert('Failed to delete admin: ' + (error?.message || 'Unknown error'));
      } finally {
        setActionLoading(prev => ({ ...prev, delete: false }));
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
  };

  const handleToggleStatus = async (adminId) => {
    try {
      setActionLoading(prev => ({ ...prev, toggleStatus: true }));
      await dispatch(toggleAdminStatus(adminId));
      await dispatch(fetchAdmins(currentFilter));
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('Failed to update admin status: ' + (error?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, toggleStatus: false }));
    }
  };

  const handleFilterChange = (filterType, value) => {
    dispatch(setCurrentFilter({ [filterType]: value, page: 1 }));
  };

  const handlePageChange = async (newPage) => {
    setActionLoading(prev => ({ ...prev, pagination: true }));
    try {
      dispatch(setCurrentFilter({ page: newPage }));
      await dispatch(fetchAdmins({ ...currentFilter, page: newPage }));
    } finally {
      setActionLoading(prev => ({ ...prev, pagination: false }));
    }
  };

  return (
    <>
      <PageLayout
        title={t("Admin Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.delete || actionLoading.toggleStatus || actionLoading.pagination}
        loadingMessage={
          actionLoading.delete ? t('Deleting admin...') :
            actionLoading.toggleStatus ? t('Updating admin status...') :
              actionLoading.pagination ? t('Loading page...') : t('Loading admins...')
        }
      >
        <RefreshBanner show={loading && admins.length > 0} label="admins" />
        {error && !error.includes('Duplicate request prevented') && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => dispatch(clearError())} aria-label="Close error">✕</button>
          </div>
        )}

        <div className={styles.usersHeader}>
          <h2 className={styles.usersTitle}>{t('All Admins')}</h2>
          <Button leftIcon={<img src={addIcon} alt="" width="22" />}
            onClick={() => navigate('/admins/add')}>
            {t('Add Admin')}
          </Button>
        </div>

        { }
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <SearchInput
              value={currentFilter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={t("Search admins...")}
            />
          </div>
          <div className={styles.filterGroup}>
            <Dropdown
              value={currentFilter.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              placeholder={t("All Roles")}
              options={[
                { value: 'admin', label: t('Admin') },
                { value: 'superadmin', label: t('Super Admin') },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <Dropdown
              value={currentFilter.isActive || ''}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              placeholder={t("All Status")}
              options={[
                { value: 'true', label: t('Active') },
                { value: 'false', label: t('Inactive') },
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
                { value: 'name_asc', label: t('Name A-Z') },
                { value: 'name_desc', label: t('Name Z-A') },
                { value: 'email_asc', label: t('Email A-Z') },
                { value: 'email_desc', label: t('Email Z-A') },
              ]}
            />
          </div>
        </div>

        { }
        {Array.isArray(admins) && admins.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>
              {t('No admins found.')}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>{t('Name')}</th>
                    <th className={styles.th}>{t('Email')}</th>
                    <th className={styles.th}>{t('Mobile')}</th>
                    <th className={styles.th}>{t('Role')}</th>
                    <th className={styles.th}>{t('Status')}</th>
                    <th className={styles.th}>{t('Created')}</th>
                    <th className={styles.th}>{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin._id}>
                      <td className={styles.td}>
                        <div className={styles.userInfo}>
                          {admin.profilePicture ? (
                            <img
                              src={admin.profilePicture}
                              alt={admin.name}
                              className={styles.userAvatar}
                            />
                          ) : (
                            <div className={styles.userAvatarPlaceholder}>
                              {admin.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={styles.userName}>{admin.name}</span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.userEmail}>{admin.email}</div>
                      </td>
                      <td className={`${styles.td} ${styles.userMobile}`}>{admin.mobile || 'N/A'}</td>
                      <td className={styles.td}>
                        <span className={`${styles.roleBadge} ${admin.role === 'superadmin' ? styles.roleSuperadmin : styles.roleAdmin}`}>
                          {admin.role === 'superadmin' ? t('👑 Super Admin') : t('Admin')}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${admin.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {admin.isActive ? t('Active') : t('Inactive')}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.dateCell}`}>
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          className={`${styles.actionBtn} ${styles.editBtn}`}
                          onClick={() => handleEdit(admin)}
                          disabled={loading || actionLoading.delete || actionLoading.toggleStatus}
                        >
                          <img src={editIcon} alt="Edit" width="25" />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${admin.isActive ? styles.toggleBtn : styles.toggleBtnActive}`}
                          onClick={() => handleToggleStatus(admin._id)}
                          disabled={loading || actionLoading.delete || actionLoading.toggleStatus}
                        >
                          {actionLoading.toggleStatus ? t('Updating...') : <img
                            src={admin.isActive ? toggleon : toggleoff}
                            alt="toggle"
                            width={28}
                          />}

                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(admin)}
                          disabled={loading || actionLoading.delete || actionLoading.toggleStatus}
                        >
                          <img src={deleteIcon} alt="Delete" width="25" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
              loading={loading || actionLoading.pagination}
              className={styles.paginationContainer}
              btnClassName={styles.paginationBtn}
              infoClassName={styles.paginationInfo}
            />
          </>
        )}
      </PageLayout>

      <DeleteConfirmationModal
        show={showDeleteModal}
        title={t("Delete Admin")}
        message={t("Are you sure you want to delete this admin?")}
        itemName={adminToDelete?.name}
        itemDetails={adminToDelete ? [
          { label: t('Email'), value: adminToDelete.email || 'N/A' },
          { label: t('Role'), value: adminToDelete.role || 'N/A' },
          { label: t('Status'), value: adminToDelete.isActive ? t('Active') : t('Inactive') },
        ] : []}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={actionLoading.delete}
        confirmText={t("Delete Admin")}
        cancelText={t("Cancel")}
      />
    </>
  );
};

export default Admins;
