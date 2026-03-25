import React from 'react';
import styles from './FormComponents.module.css';

/**
 * TextInput — styled form input with optional label and error message.
 *
 * @param {string} label      — shown above the field
 * @param {string} error      — red error message below
 * @param {string} className  — extra wrapper classes
 * @param rest                — all native <input> props (name, value, onChange, placeholder, type, required…)
 */
const TextInput = ({ label, error, className = '', ...rest }) => (
    <div className={`${styles.inputWrapper} ${className}`}>
        {label && <label className={styles.inputLabel}>{label}</label>}
        <input
            className={`${styles.inputField} ${error ? styles.inputFieldError : ''}`}
            {...rest}
        />
        {error && <span className={styles.inputError}>{error}</span>}
    </div>
);

export default TextInput;
