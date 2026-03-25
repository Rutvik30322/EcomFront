import React from 'react';
import styles from './FormComponents.module.css';

/**
 * Dropdown — styled <select> wrapper.
 *
 * @param {string}   value
 * @param {function} onChange
 * @param {{value: string, label: string}[]} options  — array of option items
 * @param {string}   placeholder   — shown as the first "All …" option (value="")
 * @param {boolean}  disabled
 * @param {string}   className
 * @param rest                     — forwarded to <select>
 *
 * Usage:
 *   <Dropdown
 *     value={currentFilter.category}
 *     onChange={(e) => handleFilterChange('category', e.target.value)}
 *     placeholder="All Categories"
 *     options={categoryNames.map(c => ({ value: c, label: c }))}
 *   />
 */
const Dropdown = ({
    value,
    onChange,
    options = [],
    placeholder,
    disabled = false,
    className = '',
    ...rest
}) => (
    <div className={`${styles.selectWrapper} ${className}`}>
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={styles.selectField}
            {...rest}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>

        {}
        <span className={styles.selectArrow} aria-hidden="true">▾</span>
    </div>
);

export default Dropdown;
