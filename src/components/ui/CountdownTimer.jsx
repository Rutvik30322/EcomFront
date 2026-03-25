import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CountdownTimer = ({ createdAt, orderStatus }) => {
    const { t } = useTranslation();
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [isWarning, setIsWarning] = useState(false); // Less than 6 hours

    useEffect(() => {
        // If order is delivered or cancelled, don't run the timer
        if (orderStatus === 'Delivered' || orderStatus === 'Cancelled') {
            return;
        }

        const targetDate = new Date(createdAt);
        targetDate.setHours(targetDate.getHours() + 48); // 48 hours from creation

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft(t('Expired'));
                return;
            }

            setIsExpired(false);

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Set warning if less than 6 hours remaining
            setIsWarning(hours < 6);

            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };

        // Calculate immediately
        calculateTimeLeft();

        // Update every second
        const timerInterval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timerInterval);
    }, [createdAt, orderStatus, t]);

    if (orderStatus === 'Delivered') {
        return <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{t('Delivered')}</span>;
    }

    if (orderStatus === 'Cancelled') {
        return <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{t('Cancelled')}</span>;
    }

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: isExpired ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4',
            color: isExpired ? '#dc2626' : isWarning ? '#d97706' : '#15803d',
            border: `1px solid ${isExpired ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0'}`,
            fontWeight: '500',
            fontSize: '0.85rem',
            minWidth: '95px',
            justifyContent: 'center',
            fontVariantNumeric: 'tabular-nums' // Keep digits aligned
        }}>
            {isExpired ? (
                <span>⚠️ {t('Expired')}</span>
            ) : (
                <span>⏱️ {timeLeft}</span>
            )}
        </div>
    );
};

export default CountdownTimer;
