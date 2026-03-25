import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMe, updateAdminProfile, changeAdminPassword } from '../../services/authService';
import { uploadService } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import dashStyles from '../dashboard/Dashboard.module.css';
import styles from './Profile.module.css';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ImagePreviewModal from '../../components/ui/ImagePreviewModal';

const Profile = ({ onLogout }) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
    profilePicture: '',
  });

  const [adminDetails, setAdminDetails] = useState({
    role: '',
    isActive: true,
    permissions: [],
    createdAt: '',
    updatedAt: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin } = useSelector(state => state.auth);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getMe();
      if (response.admin) {
        const adminData = response.admin;
        setProfileData({
          name: adminData.name || '',
          email: adminData.email || '',
          mobile: adminData.mobile || '',
          profilePicture: adminData.profilePicture || '',
        });
        setAdminDetails({
          role: adminData.role || 'admin',
          isActive: adminData.isActive !== undefined ? adminData.isActive : true,
          permissions: adminData.permissions || [],
          createdAt: adminData.createdAt || '',
          updatedAt: adminData.updatedAt || '',
        });
        dispatch(setUser(adminData));
      }
    } catch (err) {
      setError(t('Failed to load profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      setProfileData(prev => ({ ...prev, [name]: value.replace(/[^0-9]/g, '').substring(0, 10) }));
      return;
    }
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError(t('Please select an image file')); return; }
    if (file.size > 5 * 1024 * 1024) { setError(t('Image size must be less than 5MB')); return; }
    setUploadingImage(true);
    setError('');
    setSuccess('');
    try {
      const uploadResponse = await uploadService.uploadProfilePicture(file);
      if (uploadResponse.data?.data?.profilePicture) {
        setProfileData(prev => ({ ...prev, profilePicture: uploadResponse.data.data.profilePicture }));
        setSuccess(t('Profile picture uploaded!'));
        setTimeout(() => setSuccess(''), 3000);
        e.target.value = '';
      } else {
        setError(t('No image URL received from server'));
      }
    } catch (error) {
      setError(t('Error uploading image: ') + (error.response?.data?.message || error.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const response = await updateAdminProfile(profileData);
      setSuccess(t('Profile updated successfully!'));
      if (response?.admin) {
        const u = response.admin;
        setAdminDetails({
          role: u.role || adminDetails.role,
          isActive: u.isActive !== undefined ? u.isActive : adminDetails.isActive,
          permissions: u.permissions || adminDetails.permissions,
          createdAt: u.createdAt || adminDetails.createdAt,
          updatedAt: u.updatedAt || new Date().toISOString(),
        });
        dispatch(setUser(u));
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError(t('Please fill in all fields')); return;
    }
    if (passwordData.newPassword.length < 6) {
      setError(t('Password must be at least 6 characters')); return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('New passwords do not match')); return;
    }
    setLoading(true);
    try {
      await changeAdminPassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess(t('Password changed successfully!'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to change password'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : t('N/A');

  const initials = profileData.name
    ? profileData.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2)
    : 'A';

  return (
    <div className={dashStyles.dashboardContainer}>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`${dashStyles.mainContent} ${!sidebarOpen ? dashStyles.mainContentExpanded : ''}`}>
        <Header title={t("Profile Settings")} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className={dashStyles.dashboardContent}>
          <div className={styles.profileWrapper}>

            { }
            <div className={styles.tabs}>
              <button
                className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                {t('Profile')}
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === 'password' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab('password')}
              >
                {t('Change Password')}
              </button>
            </div>

            { }
            {error && <div className={styles.alertError}>{error}</div>}
            {success && <div className={styles.alertSuccess}>{success}</div>}

            { }
            {activeTab === 'profile' && (
              <div className={styles.profileTabLayout}>

                { }
                <div className={styles.accountCard}>
                  <h3 className={styles.accountCardTitle}>{t('Account Details')}</h3>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('Name')}</span>
                    <div className={styles.infoValue}>{profileData.name || t('N/A')}</div>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('Mobile')}</span>
                    <div className={styles.infoValue}>{profileData.mobile || t('Not set')}</div>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('Role')}</span>
                    <div className={styles.infoValue}>
                      {adminDetails.role === 'superadmin' ? t('👑 Super Admin') : t('👤 Admin')}
                    </div>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('Status')}</span>
                    <div className={`${styles.infoValue} ${adminDetails.isActive ? styles.infoValueActive : styles.infoValueInactive}`}>
                      {adminDetails.isActive ? t('✅ Active') : t('❌ Inactive')}
                    </div>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('Member Since')}</span>
                    <div className={styles.infoValue}>{formatDate(adminDetails.createdAt)}</div>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>{t('Last Updated')}</span>
                    <div className={styles.infoValue}>{formatDate(adminDetails.updatedAt)}</div>
                  </div>

                  {adminDetails.permissions && adminDetails.permissions.length > 0 && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>{t('Permissions')}</span>
                      <div className={styles.permissionsWrap}>
                        {adminDetails.permissions.map((p, i) => (
                          <span key={i} className={styles.permBadge}>
                            {p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                { }
                <div className={styles.editCard}>
                  <h3 className={styles.editCardTitle}>{t('Edit Profile')}</h3>
                  <form onSubmit={handleUpdateProfile}>
                    <div className={styles.formGrid}>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('Name')} *</label>
                        <input
                          className={styles.formInput}
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('Email')} *</label>
                        <input
                          className={styles.formInput}
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>{t('Mobile Number')}</label>
                        <input
                          className={styles.formInput}
                          type="tel"
                          name="mobile"
                          value={profileData.mobile}
                          onChange={handleProfileChange}
                          pattern="[0-9]{10}"
                          maxLength={10}
                          placeholder={t("10-digit number")}
                        />
                        <p className={styles.formHint}>{t('10-digit mobile number')}</p>
                      </div>

                      <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                        <label className={styles.formLabel}>{t('Profile Picture')}</label>
                        <div className={styles.avatarRow}>
                          {profileData.profilePicture ? (
                            <img
                              src={profileData.profilePicture}
                              alt="Profile"
                              className={styles.avatar}
                              onError={(e) => { e.target.style.display = 'none'; }}
                              onClick={() => setPreviewImage(profileData.profilePicture)}
                              style={{ cursor: 'pointer' }}
                            />
                          ) : (
                            <div className={styles.avatarPlaceholder}>{initials}</div>
                          )}
                          <div className={styles.fileInputWrap}>
                            <input
                              className={styles.fileInput}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={loading || uploadingImage}>
                      {loading ? t('Saving...') : t('Save Profile')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className={styles.passwordCard}>
                <h3 className={styles.passwordCardTitle}>{t('Change Password')}</h3>
                <form onSubmit={handleChangePassword}>
                  <div className={styles.passwordFields}>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('Current Password')}</label>
                      <input
                        className={styles.formInput}
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('New Password')}</label>
                      <input
                        className={styles.formInput}
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        minLength={6}
                        required
                      />
                      <p className={styles.formHint}>{t('At least 6 characters')}</p>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>{t('Confirm New Password')}</label>
                      <input
                        className={styles.formInput}
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        minLength={6}
                        required
                      />
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                      {loading ? t('Changing...') : t('Change Password')}
                    </button>

                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </main>

      <ImagePreviewModal
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default Profile;
