import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchUsers, deleteUser, toggleUserStatus,
  setCurrentFilter, clearError
} from '../../store/slices/userSlice';
import { useSocket } from '../../contexts/SocketContext';
import PageLayout from '../../components/ui/PageLayout';
import Pagination from '../../components/ui/Pagination';
import RefreshBanner from '../../components/ui/RefreshBanner';
import DeleteConfirmationModal from '../../components/ui/DeleteConfirmationModal';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Dropdown from '../../components/ui/Dropdown';
import styles from './Users.module.css';
import editIcon from "../../assets/svg/edit.svg";
import deleteIcon from "../../assets/svg/delete.svg";
import addIcon from "../../assets/svg/add.svg";
import toggleoff from "../../assets/svg/toggle_off.svg";
import toggleon from "../../assets/svg/toggle_on.svg";
import { useTranslation } from 'react-i18next';

const Users = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: users, loading, error, pagination, currentFilter } = useSelector(state => state.users);
  const { onDataUpdate } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState({ delete: false, toggleStatus: false, pagination: false });

  useEffect(() => {
    dispatch(fetchUsers(currentFilter)).unwrap().catch(err => {
      if (String(err).includes('Duplicate request prevented'))
        setTimeout(() => dispatch(fetchUsers(currentFilter)), 500);
    });
  }, [dispatch, currentFilter]);

  useEffect(() => {
    if (!onDataUpdate) return;
    return onDataUpdate('users', () => dispatch(fetchUsers(currentFilter)));
  }, [onDataUpdate, dispatch, currentFilter]);

  const handleEdit = (u) => navigate(`/users/edit/${u._id}`);
  const handleDelete = (u) => { setUserToDelete(u); setShowDeleteModal(true); };
  const cancelDelete = () => { setShowDeleteModal(false); setUserToDelete(null); };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(prev => ({ ...prev, delete: true }));
      await dispatch(deleteUser(userToDelete._id));
      await dispatch(fetchUsers(currentFilter));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      alert('Failed to delete user: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, delete: false }));
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, toggleStatus: true }));
      await dispatch(toggleUserStatus(userId));
      await dispatch(fetchUsers(currentFilter));
    } catch (err) {
      alert('Failed to update user status: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, toggleStatus: false }));
    }
  };

  const handleFilterChange = (filterType, value) =>
    dispatch(setCurrentFilter({ [filterType]: value, page: 1 }));

  const handlePageChange = async (newPage) => {
    setActionLoading(prev => ({ ...prev, pagination: true }));
    try {
      dispatch(setCurrentFilter({ page: newPage }));
      await dispatch(fetchUsers({ ...currentFilter, page: newPage }));
    } finally {
      setActionLoading(prev => ({ ...prev, pagination: false }));
    }
  };

  return (
    <>
      <PageLayout
        title={t("User Management")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        loading={loading || actionLoading.delete || actionLoading.toggleStatus || actionLoading.pagination}
        loadingMessage={
          actionLoading.delete ? t('Deleting user...') :
            actionLoading.toggleStatus ? t('Updating user status...') :
              actionLoading.pagination ? t('Loading page...') : t('Loading users...')
        }
      >
        <RefreshBanner show={loading && users.length > 0} label="users" />

        {error && !error.includes('Duplicate request prevented') && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
            <button onClick={() => dispatch(clearError())} aria-label="Close error">✕</button>
          </div>
        )}

        <div className={styles.usersHeader}>
          <h2 className={styles.usersTitle}>{t('All Users')}</h2>
          <Button leftIcon={<img src={addIcon} alt="" width="22" />}
            onClick={() => navigate('/users/add')}>
            {t('Add User')}
          </Button>
        </div>

        <div className={styles.filtersContainer}>
          <div className={styles.searchGroup}>
            <SearchInput
              value={currentFilter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={t("Search users...")}
            />
          </div>
          <div className={styles.filterGroup}>
            <Dropdown
              value={currentFilter.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              placeholder={t("All Roles")}
              options={[
                { value: 'customer', label: t('Customer') },
                { value: 'admin', label: t('Admin') },
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

        {Array.isArray(users) && users.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>{t('No users found.')}</p>
          </div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>{t('Sr No')}</th>
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
                  {users.map((user, index) => (
                    <tr key={user._id}>
                      <td className={styles.td}>{(pagination?.page - 1) * (pagination?.limit || 10) + index + 1}</td>
                      <td className={styles.td}>
                        <div className={styles.userInfo}>
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className={styles.userAvatar} />
                          ) : (
                            <div className={styles.userAvatarPlaceholder}>{user.name.charAt(0).toUpperCase()}</div>
                          )}
                          <span className={styles.userName}>{user.name}</span>
                        </div>
                      </td>
                      <td className={styles.td}><div className={styles.userEmail}>{user.email}</div></td>
                      <td className={`${styles.td} ${styles.userMobile}`}>{user.mobile}</td>
                      <td className={styles.td}>
                        <span className={`${styles.roleBadge} ${styles[`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${user.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {user.isActive ? t('Active') : t('Inactive')}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.dateCell}`}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className={styles.actionsCell}>
                        <button className={`${styles.actionBtn} ${styles.editBtn}`}
                          onClick={() => handleEdit(user)}
                          disabled={loading || actionLoading.delete || actionLoading.toggleStatus}>
                          <img src={editIcon} alt="Edit" width="25" />
                        </button>
                        <button className={`${styles.actionBtn} ${user.isActive ? styles.toggleBtn : styles.toggleBtnActive}`}
                          onClick={() => handleToggleStatus(user._id)}
                          disabled={loading || actionLoading.delete || actionLoading.toggleStatus}>
                          {actionLoading.toggleStatus ? t('Updating...') : (
                            <img src={user.isActive ? toggleon : toggleoff} alt="toggle" width={28} />
                          )}
                        </button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDelete(user)}
                          disabled={loading || actionLoading.delete || actionLoading.toggleStatus}>
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
        title={t("Delete User")}
        message={t("Are you sure you want to delete this user?")}
        itemName={userToDelete?.name}
        itemDetails={userToDelete ? [
          { label: t('Email'), value: userToDelete.email || 'N/A' },
          { label: t('Role'), value: userToDelete.role || 'N/A' },
          { label: t('Status'), value: userToDelete.isActive ? t('Active') : t('Inactive') },
        ] : []}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={actionLoading.delete}
        confirmText={t("Delete User")}
        cancelText={t("Cancel")}
      />
    </>
  );
};

export default Users;