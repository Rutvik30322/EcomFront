import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ImagePreviewModal = ({ imageUrl, onClose }) => {
    const { t } = useTranslation();
    const [zoomLevel, setZoomLevel] = useState(1);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!imageUrl) return null;

    return (
        <div
            onClick={onClose}
            onWheel={(e) => {
                e.preventDefault();
                const zoomAmount = 0.1;
                setZoomLevel(prev => {
                    const newZoom = e.deltaY < 0 ? prev + zoomAmount : prev - zoomAmount;
                    return Math.max(0.5, Math.min(newZoom, 4)); // Limit zoom between 0.5x and 4x
                });
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 9999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'zoom-out',
                padding: '2rem',
                overflow: 'hidden'
            }}
        >
            <img
                src={imageUrl}
                alt="Expanded preview"
                style={{
                    maxWidth: '90%',
                    maxHeight: '90%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    transform: `scale(${zoomLevel})`,
                    transition: 'transform 0.1s ease-out',
                    cursor: 'grab'
                }}
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => e.preventDefault()}
            />
            <div style={{
                position: 'absolute',
                bottom: '20px',
                color: 'white',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                pointerEvents: 'none'
            }}>
                {t('Scroll to zoom')} {Math.round(zoomLevel * 100)}%
            </div>
            <button
                type="button"
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '30px',
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '40px',
                    cursor: 'pointer',
                    lineHeight: 1
                }}
            >
                &times;
            </button>
        </div>
    );
};

export default ImagePreviewModal;
