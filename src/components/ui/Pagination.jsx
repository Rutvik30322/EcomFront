import React from 'react';

/**
 * Pagination — reusable First/Prev/page-numbers/Next/Last bar.
 *
 * Props:
 *   pagination   { page, pages, total?, limit? }
 *   onPageChange (newPage: number) => void
 *   loading      {boolean}  disables all buttons while loading
 *   className    {string}   container class  (e.g. styles.paginationContainer)
 *   btnClassName {string}   button class     (e.g. styles.paginationBtn)
 *   infoClassName{string}   info span class  (e.g. styles.paginationInfo)
 *   showTotal    {boolean}  show "Page X of Y (Z total)" (default true)
 */
const Pagination = ({
    pagination,
    onPageChange,
    loading = false,
    className = '',
    btnClassName = '',
    infoClassName = '',
    showTotal = true,
}) => {
    if (!pagination || pagination.pages <= 1) return null;

    const { page, pages, total } = pagination;

    const getPageNumbers = () => {
        let start = Math.max(1, page - 2);
        let end = Math.min(pages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);
        const nums = [];
        for (let i = start; i <= end; i++) nums.push(i);
        return nums;
    };

    const btn = (label, targetPage, disabled) => (
        <button
            key={label}
            className={btnClassName}
            onClick={() => onPageChange(targetPage)}
            disabled={disabled || loading}
        >
            {label}
        </button>
    );

    return (
        <div className={className}>
            {btn('«', 1, page === 1)}
            {btn('‹ Prev', page - 1, page === 1)}

            {getPageNumbers().map(p => (
                <button
                    key={p}
                    className={btnClassName}
                    onClick={() => onPageChange(p)}
                    disabled={loading}
                    style={p === page ? { background: '#381230', color: 'white', borderColor: '#381230', fontWeight: 700 } : {}}
                >
                    {p}
                </button>
            ))}

            {btn('Next ›', page + 1, page === pages)}
            {btn('»', pages, page === pages)}

            {showTotal && (
                <span className={infoClassName}>
                    Page {page} of {pages}{total != null ? ` (${total} total)` : ''}
                </span>
            )}
        </div>
    );
};

export default Pagination;
