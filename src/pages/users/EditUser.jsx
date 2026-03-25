import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUsers, createUser, updateUser } from '../../store/slices/userSlice';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import styles from './Users.module.css';
import dashboardStyles from '../dashboard/Dashboard.module.css';
import { useTranslation } from 'react-i18next';

const EditUser = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items: users, loading } = useSelector(state => state.users);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'customer',
    isActive: true,
    profilePicture: '',
    addresses: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState(null);

  const isEditMode = id && id !== 'new';

  useEffect(() => {
    if (isEditMode) {
      dispatch(fetchUsers({}));
    }
  }, [dispatch, isEditMode]);

  useEffect(() => {
    if (isEditMode && users.length > 0) {
      const user = users.find(u => u._id === id);
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          mobile: user.mobile || '',
          password: '',
          role: user.role || 'customer',
          isActive: typeof user.isActive !== 'undefined' ? user.isActive : true,
          profilePicture: user.profilePicture || '',
          addresses: Array.isArray(user.addresses) ? [...user.addresses] : []
        });
      }
    } else if (!isEditMode) {

      setFormData({
        name: '',
        email: '',
        mobile: '',
        password: '',
        role: 'customer',
        isActive: true,
        profilePicture: '',
        addresses: []
      });
    }
  }, [id, users, isEditMode]);

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

  const showError = (message) => {
    setErrorPopup(message);
    setIsLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorPopup(null);
    setIsLoading(true);

    try {
      const userData = { ...formData };

      if (!isEditMode && (!userData.password || userData.password.trim() === '')) {
        showError('Password is required for new users.');
        return;
      }

      if (!isEditMode && userData.password && userData.password.length < 6) {
        showError('Password must be at least 6 characters long.');
        return;
      }

      if (isEditMode) {
        if (!userData.password || userData.password.trim() === '') {
          delete userData.password;
        }

        const updateData = {
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile,
          role: userData.role || 'customer',
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          ...(userData.password && userData.password.trim() !== '' && { password: userData.password }),
          ...(userData.profilePicture && { profilePicture: userData.profilePicture }),
          ...(userData.addresses && Array.isArray(userData.addresses) && { addresses: userData.addresses })
        };

        await dispatch(updateUser({ id, userData: updateData })).unwrap();
      } else {
        await dispatch(createUser(userData)).unwrap();
      }

      navigate('/users');
    } catch (error) {
      console.error('Error saving user:', error);

      // Redux unwrap() throws the rejectWithValue payload directly (a plain string),
      // so we check typeof string first, then fallback to error.message
      const rawMessage =
        typeof error === 'string'
          ? error
          : error?.message || error?.payload || '';

      // Map raw API messages to proper user-friendly messages
      const getFriendlyMessage = (msg) => {
        const lower = (msg || '').toLowerCase();
        if (lower.includes('email') && lower.includes('mobile') && (lower.includes('already') || lower.includes('exist') || lower.includes('duplicate'))) {
          return 'This email address or mobile number is already registered with another account. Please use a different email or mobile number.';
        }
        if (lower.includes('email') && (lower.includes('already') || lower.includes('exist') || lower.includes('duplicate'))) {
          return 'This email address is already registered. Please use a different email.';
        }
        if (lower.includes('mobile') && (lower.includes('already') || lower.includes('exist') || lower.includes('duplicate'))) {
          return 'This mobile number is already registered. Please use a different mobile number.';
        }
        if (lower.includes('duplicate') || lower.includes('already exists')) {
          return 'A user with these details already exists. Please check the email and mobile number.';
        }
        if (lower.includes('network') || lower.includes('connection')) {
          return 'Network error. Please check your internet connection and try again.';
        }
        if (lower.includes('unauthorized') || lower.includes('forbidden')) {
          return 'You do not have permission to perform this action.';
        }
        return msg || 'Something went wrong. Please try again.';
      };

      showError(getFriendlyMessage(rawMessage));
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || (isEditMode && users.length === 0)) {
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
        message={isEditMode ? t('Updating user...') : t('Creating user...')}
      />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`${dashboardStyles.mainContent} ${!sidebarOpen ? dashboardStyles.mainContentExpanded : ''}`}>
        <Header
          title={isEditMode ? t('Edit User') : t('Add New User')}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className={dashboardStyles.dashboardContent}>
          <div className={styles.formPageContainer}>
            {errorPopup && (
              <div className={styles.errorPopup}>
                <div className={styles.errorPopupIcon}>⚠️</div>
                <div className={styles.errorPopupText}>
                  <strong>{t('Error')}</strong>
                  <p>{errorPopup}</p>
                </div>
                <button
                  className={styles.errorPopupClose}
                  onClick={() => setErrorPopup(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            )}
            { }
            <button
              className={styles.backButton}
              onClick={() => navigate('/users')}
            >
              {t('← Back to Users')}
            </button>

            <div className={styles.formContainer}>
              <h2 className={styles.formTitle}>
                {isEditMode ? t('Edit User') : t('Add New User')}
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
                        placeholder={t("Enter full name")}
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
                        value={formData.role || 'customer'}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="customer">{t('Customer')}</option>
                        <option value="admin">{t('Admin')}</option>
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
                      <span>{t('User is active')}</span>
                    </label>
                  </div>
                </div>

                { }
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => navigate('/users')}
                  >
                    {t('Cancel')}
                  </button>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? t('Saving...') : (isEditMode ? t('Update User') : t('Create User'))}
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

export default EditUser;
