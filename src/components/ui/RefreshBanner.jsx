import React from 'react';

/**
 * RefreshBanner — blue "Refreshing…" spinner bar shown when data is
 * silently reloading in the background (i.e. list already has items).
 *
 * Props:
 *   show   {boolean}  render the banner when true
 *   label  {string}   e.g. "products", "users" → "Refreshing products..."
 */
const RefreshBanner = ({ show, label = 'data' }) => {
    if (!show) return null;
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem', marginBottom: '1rem',
            backgroundColor: '#eff6ff', border: '1px solid #3b82f6',
            borderRadius: '6px', color: '#1e40af',
            fontSize: '0.9rem', fontWeight: '500', justifyContent: 'center',
        }}>
            <div style={{
                width: '16px', height: '16px',
                border: '2px solid #3b82f6', borderTopColor: 'transparent',
                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <span>Refreshing {label}...</span>
        </div>
    );
};

export default RefreshBanner;
