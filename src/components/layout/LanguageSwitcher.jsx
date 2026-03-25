import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className={styles.switcherContainer}>
            <select
                className={styles.languageSelect}
                value={i18n.language?.split('-')[0] || 'en'}
                onChange={(e) => changeLanguage(e.target.value)}
            >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
