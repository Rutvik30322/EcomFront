import React from 'react';
import styles from './FormComponents.module.css';

/**
 * Button — reusable button with variants matching the existing design.
 *
 * @param {'primary'|'danger'|'ghost'|'icon'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} loading  — shows spinner, disables button
 * @param {boolean} disabled
 * @param {React.ReactNode} leftIcon   — icon before label (e.g. <img> or SVG)
 * @param {string} className           — extra classes
 * @param {React.ButtonHTMLAttributes} rest — all native button props
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    className = '',
    ...rest
}) => {
    const variantClass = {
        primary: styles.btnPrimary,
        danger: styles.btnDanger,
        ghost: styles.btnGhost,
        icon: styles.btnIcon,
    }[variant] || styles.btnPrimary;

    const sizeClass = {
        sm: styles.btnSm,
        md: styles.btnMd,
        lg: styles.btnLg,
    }[size] || styles.btnMd;

    return (
        <button
            className={`${styles.btn} ${variantClass} ${sizeClass} ${className}`}
            disabled={disabled || loading}
            {...rest}
        >
            {loading && <span className={styles.spinner} aria-hidden="true" />}
            {!loading && leftIcon && leftIcon}
            {children}
        </button>
    );
};

export default Button;
