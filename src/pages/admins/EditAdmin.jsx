import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAdmins, createAdmin, updateAdmin } from '../../store/slices/adminSlice';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import styles from '../users/Users.module.css';
import dashboardStyles from '../dashboard/Dashboard.module.css';
import { useTranslation } from 'react-i18next';

const EditAdmin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items: admins, loading } = useSelector(state => state.admins);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'admin',
    isActive: true,
    profilePicture: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = id && id !== 'new';

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchAdmins({}));
    }
  }, [dispatch, isEditMode]);

  useEffect(() => {
    if (isEditMode && admins.length > 0) {
      const admin = admins.find(a => a._id === id);
      if (admin) {
        setFormData({
          name: admin.name || '',
          email: admin.email || '',
          mobile: admin.mobile || '',
          password: '',
          role: admin.role || 'admin',
          isActive: typeof admin.isActive !== 'undefined' ? admin.isActive : true,
          profilePicture: admin.profilePicture || '',
        });
      }
    } else if (!isEditMode) {

      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: '',
        role: 'admin',
        isActive: true,
        profilePicture: '',
      });
    }
  }, [id, admins, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'mobile') {
      const mobileValue = value.replace(/[^0-9]/g, '').substring(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: mobileValue
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const adminData = { ...formData };

      if (!isEditMode && (!adminData.password || adminData.password.trim() === '')) {
        alert('Password is required for new admins');
        setIsLoading(false);
        return;
      }

      if (!isEditMode && adminData.password && adminData.password.length < 6) {
        alert('Password must be at least 6 characters');
        setIsLoading(false);
        return;
      }

      if (isEditMode) {

        if (!adminData.password || adminData.password.trim() === '') {
          delete adminData.password;
        }

        const updateData = {
          name: adminData.name,
          email: adminData.email,
          mobile: adminData.mobile,
          role: adminData.role || 'admin',
          isActive: adminData.isActive !== undefined ? adminData.isActive : true,
          ...(adminData.password && adminData.password.trim() !== '' && { password: adminData.password }),
          ...(adminData.profilePicture && { profilePicture: adminData.profilePicture })
        };

        await dispatch(updateAdmin({ id, adminData: updateData })).unwrap();
      } else {
        await dispatch(createAdmin(adminData)).unwrap();
      }

      navigate('/admins');
    } catch (error) {
      console.error('Error saving admin:', error);
      const errorMessage = error?.message || error?.payload || 'Unknown error';
      alert('Error saving admin: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || (isEditMode && admins.length === 0)) {
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
        message={isEditMode ? t('Updating admin...') : t('Creating admin...')}
      />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`${dashboardStyles.mainContent} ${!sidebarOpen ? dashboardStyles.mainContentExpanded : ''}`}>
        <Header
          title={isEditMode ? t('Edit Admin') : t('Add New Admin')}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className={dashboardStyles.dashboardContent}>
          <div className={styles.formPageContainer}>
            { }
            <button
              className={styles.backButton}
              onClick={() => navigate('/admins')}
            >
              {t('← Back to Admins')}
            </button>

            <div className={styles.formContainer}>
              <h2 className={styles.formTitle}>
                {isEditMode ? t('Edit Admin') : t('Add New Admin')}
              </h2>

              <form onSubmit={handleSubmit} className={styles.userForm}>
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
                        placeholder={t("Enter admin name")}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email">{t('Email *')}</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder={t("Enter email address")}
                      />
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="mobile">{t('Mobile Number *')}</label>
                      <input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]{10}"
                        maxLength={10}
                        placeholder={t("Enter 10-digit mobile number")}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="role">{t('Role *')}</label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role || 'admin'}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="admin">{t('Admin')}</option>
                        <option value="superadmin">{t('Super Admin')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                { }
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>{t('Security')}</h3>
                  <div className={styles.formGroup}>
                    <label htmlFor="password">
                      {isEditMode ? t('New Password (leave blank to keep current)') : t('Password *')}
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      {...(!isEditMode && { required: true })}
                      minLength="6"
                      placeholder={isEditMode ? t("Enter new password (optional)") : t("Enter password (min 6 characters)")}
                    />
                    <small className={styles.helpText}>
                      {isEditMode ? t("Leave blank if you don't want to change the password") : t("Password must be at least 6 characters long")}
                    </small>
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
                      <span>{t('Admin is active')}</span>
                    </label>
                  </div>
                </div>

                { }
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => navigate('/admins')}
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? t('Saving...') : (isEditMode ? t('Update Admin') : t('Create Admin'))}
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

export default EditAdmin;
