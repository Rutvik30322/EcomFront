import React from 'react';
import styles from './FormComponents.module.css';

/**
 * SearchInput — text input with a built-in search icon and optional clear (✕) button.
 *
 * @param {string}   value
 * @param {function} onChange   — called with the native event
 * @param {string}   placeholder
 * @param {boolean}  showClear  — show ✕ button when value is non-empty (default true)
 * @param {function} onClear    — called when ✕ is clicked
 * @param {string}   className
 */
const SearchInput = ({
    value = '',
    onChange,
    placeholder = 'Search...',
    showClear = true,
    onClear,
    className = '',
    ...rest
}) => {
    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onChange) {

            onChange({ target: { value: '' } });
        }
    };

    return (
        <div className={`${styles.searchWrapper} ${className}`}>
            {}
            <svg
                className={styles.searchIcon}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
            >
                <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                />
            </svg>

            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={styles.searchField}
                {...rest}
            />

            {showClear && value && (
                <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={handleClear}
                    aria-label="Clear search"
                >
                    ✕
                </button>
            )}
        </div>
    );
};

export default SearchInput;
