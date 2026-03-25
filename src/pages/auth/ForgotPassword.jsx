import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendAdminOtp, verifyAdminOtp, resetAdminPassword } from '../../services/authService';
import styles from './Login.module.css';

const ForgotPassword = () => {
  const [step, setStep] = useState('mobile'); // 'mobile', 'otp', 'reset'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const navigate = useNavigate();

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendAdminOtp(mobile);
      setSuccess('OTP sent successfully. Please check your mobile.');
      setStep('otp');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    await handleSendOtp({ preventDefault: () => {} });
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyAdminOtp(mobile, otp);
      setSuccess('OTP verified successfully');
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await resetAdminPassword(mobile, otp, newPassword);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMobileStep = () => (
    <form className={styles.loginForm} onSubmit={handleSendOtp}>
      <div className={styles.formGroup}>
        <label htmlFor="mobile">Mobile Number</label>
        <input
          type="tel"
          id="mobile"
          placeholder="Enter your 10-digit mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, '').substring(0, 10))}
          pattern="[0-9]{10}"
          maxLength={10}
          required
        />
      </div>
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Sending OTP...' : 'Send OTP →'}
      </button>
    </form>
  );

  const renderOtpStep = () => (
    <form className={styles.loginForm} onSubmit={handleVerifyOtp}>
      <div className={styles.formGroup}>
        <label htmlFor="otp">Enter OTP</label>
        <input
          type="text"
          id="otp"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
          maxLength={6}
          style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
          required
        />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '0.5rem' }}>
          OTP sent to {mobile.substring(0, 3)}***{mobile.substring(6)}
        </p>
      </div>
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Verifying...' : 'Verify OTP →'}
      </button>
      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        {resendTimer > 0 ? (
          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Resend OTP in {resendTimer}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            className={styles.forgotPasswordButton}
          >
            Resend OTP
          </button>
        )}
      </div>
    </form>
  );

  const renderResetStep = () => (
    <form className={styles.loginForm} onSubmit={handleResetPassword}>
      <div className={styles.formGroup}>
        <label htmlFor="newPassword">New Password</label>
        <div className={styles.passwordInputWrapper}>
          <input
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            placeholder="Enter new password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={styles.passwordInput}
            required
            minLength={6}
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
          >
            {showNewPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="confirmPassword">Confirm Password</label>
        <div className={styles.passwordInputWrapper}>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.passwordInput}
            required
            minLength={6}
          />
          <button
            type="button"
            className={styles.eyeButton}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="currentColor"/>
              </svg>
            )}
          </button>
        </div>
      </div>
      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password →'}
      </button>
    </form>
  );

  return (
    <div className={styles.loginContainer}>
      <div className={styles.bgLayer} />
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.bgGrid} />
      <div className={styles.loginCard}>
        {/* Brand */}
        <div className={styles.brandSection}>
          <div className={styles.logoMark}>
            <img
              src="https://img.icons8.com/fluency/64/shopping-cart.png"
              alt="ShopNova Logo"
              style={{ width: 44, height: 44, borderRadius: 10 }}
              onError={e => { e.target.style.display='none'; }}
            />
          </div>
          <div className={styles.brandText}>
            <h1 className={styles.brandName}>Shop<span>Nova</span></h1>
            <p className={styles.brandTagline}>Admin Panel</p>
          </div>
        </div>
        <div className={styles.divider} />
        <h2 className={styles.loginTitle}>
          {step === 'mobile' && '🔐 Forgot Password'}
          {step === 'otp' && '📲 Enter OTP'}
          {step === 'reset' && '🔑 Reset Password'}
        </h2>
        <p className={styles.loginSubtitle}>
          {step === 'mobile' && 'Enter your mobile number to receive OTP'}
          {step === 'otp' && 'Enter the OTP sent to your mobile'}
          {step === 'reset' && 'Create a strong new password'}
        </p>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        
        {step === 'mobile' && renderMobileStep()}
        {step === 'otp' && renderOtpStep()}
        {step === 'reset' && renderResetStep()}

        <div className={styles.forgotPasswordContainer}>
          <button
            type="button"
            className={styles.forgotPasswordButton}
            onClick={() => {
              if (step === 'mobile') {
                navigate('/login');
              } else {
                setStep('mobile');
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
              }
            }}
          >
            {step === 'mobile' ? 'Back to Login' : 'Change Mobile'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
