import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import styles from './Purchase.module.css';
import deleteIcon from "../../assets/svg/delete.svg";
import { useSelector, useDispatch } from 'react-redux';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchPurchase, createpurchases, updatepurchases } from '../../store/slices/purchaseSlice';
import { fetchProductsByCategory, fetchProducts } from '../../store/slices/productSlice';
import { purchaseService } from '../../services/api';
import { useTranslation } from 'react-i18next';

const EditPurchase = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const dispatch = useDispatch();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const { items: purchase, loading } = useSelector(state => state.purchases);
    const { items: categoriesFromStore } = useSelector(state => state.categories);
    const { productsByCategory } = useSelector(state => state.products);

    const [formData, setFormData] = useState({
        purchaseNo: '',
        supplierName: '',
        invoiceNo: '',
        invoiceDate: '',
        items: [
            {
                category: '',
                product: '',
                quantity: '',
                purchaseRate: '',
                mrp: '',
                expiryDate: '',
                batchNo: ''
            }
        ]
    });
    const isEditMode = id && id !== 'new';

    useEffect(() => {

        dispatch(fetchCategories(false));
        if (isEditMode) {
            dispatch(fetchPurchase());
        } else {

            purchaseService.getNextPurchaseNo()
                .then(res => {
                    const nextNo = res?.data?.data?.purchaseNo || '';
                    if (nextNo) {
                        setFormData(prev => ({ ...prev, purchaseNo: nextNo }));
                    }
                })
                .catch(err => console.error('Failed to fetch next purchase no:', err));
        }
    }, [dispatch, isEditMode]);

    useEffect(() => {
        if (categoriesFromStore && categoriesFromStore.length > 0) {
            setCategories(categoriesFromStore);
        }
    }, [categoriesFromStore]);

    useEffect(() => {
        if (isEditMode && purchase.length > 0) {
            const foundPurchase = purchase.find(p => p._id === id);
            if (foundPurchase) {

                const mappedItems = Array.isArray(foundPurchase.items) && foundPurchase.items.length > 0
                    ? foundPurchase.items.map(item => {
                        const productObj = item.product && typeof item.product === 'object' ? item.product : null;
                        const productId = productObj ? productObj._id : (item.product || '');
                        const category = productObj ? (productObj.category || item.category || '') : (item.category || '');
                        return {
                            category,
                            product: productId,
                            quantity: item.quantity || '',
                            purchaseRate: item.purchaseRate || '',
                            mrp: item.mrp || '',
                            expiryDate: item.expiryDate ? item.expiryDate.substring(0, 10) : '',
                            batchNo: item.batchNo || ''
                        };
                    })
                    : [{ category: '', product: '', quantity: '', purchaseRate: '', mrp: '', expiryDate: '', batchNo: '' }];

                setFormData({
                    purchaseNo: foundPurchase.purchaseNo || '',
                    supplierName: foundPurchase.supplierName || '',
                    invoiceNo: foundPurchase.invoiceNo || '',
                    invoiceDate: foundPurchase.invoiceDate ? foundPurchase.invoiceDate.substring(0, 10) : '',
                    items: mappedItems,
                });

                const uniqueCategories = [...new Set(mappedItems.map(i => i.category).filter(Boolean))];
                uniqueCategories.forEach(cat => dispatch(fetchProductsByCategory(cat)));
            }
        } else if (!isEditMode) {
            setFormData({
                purchaseNo: '',
                supplierName: '',
                invoiceNo: '',
                invoiceDate: '',
                items: [{ category: '', product: '', quantity: '', purchaseRate: '', mrp: '', expiryDate: '', batchNo: '' }]
            });
        }
    }, [id, purchase, isEditMode]);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;

        const updatedItems = [...formData.items];
        updatedItems[index][name] = value;

        if (name === 'category') {
            updatedItems[index].product = '';
        }

        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));

        if (name === 'category' && value) {
            dispatch(fetchProductsByCategory(value));
        }
    };

    const addNewItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    category: '',
                    product: '',
                    quantity: '',
                    purchaseRate: '',
                    mrp: '',
                    expiryDate: '',
                    batchNo: ''
                }
            ]
        }));
    };

    const removeItem = (index) => {
        const updatedItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const purchaseData = { ...formData };

        if (isEditMode) {
            await dispatch(updatepurchases({ id, purchaseData }));
        } else {
            await dispatch(createpurchases(purchaseData));
        }

        dispatch(fetchProducts({}));

        navigate('/purchaseScreen');
    };

    return (
        <div className={styles.dashboardContainer}>
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`${styles.mainContent} ${!sidebarOpen ? styles.mainContentExpanded : ''}`}>
                <Header
                    title={isEditMode ? t("Edit Purchase") : t("Add Purchase")}
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                <div className={styles.dashboardContent}>
                    <div className={styles.formPageContainer}>
                        <button
                            className={styles.backButton}
                            onClick={() => navigate('/purchaseScreen')}
                        >
                            {t('← Back to Purchases')}
                        </button>

                        <div className={styles.formContainer}>
                            <h2 className={styles.formTitle}>{isEditMode ? t("Edit Purchase") : t("Add Purchase")}</h2>

                            <form onSubmit={handleSubmit} className={styles.productForm}>

                                { }
                                <div className={styles.formSection}>
                                    <h3 className={styles.sectionTitle}>{t('Purchase Details')}</h3>

                                    <div className={styles.purchaseRowHeader}>
                                        <span>{t('Purchase No')}</span>
                                        <span>{t('Supplier Name')}</span>
                                        <span>{t('Invoice No')}</span>
                                        <span>{t('Invoice Date')}</span>
                                    </div>

                                    <div className={styles.purchaseRow}>
                                        <input
                                            type="text"
                                            name="purchaseNo"
                                            value={formData.purchaseNo}
                                            readOnly
                                            style={{
                                                background: '#f3f4f6',
                                                cursor: 'not-allowed',
                                                color: '#374151',
                                                fontWeight: '600',
                                                letterSpacing: '0.05em'
                                            }}
                                            title={t("Purchase number is auto-generated and cannot be changed")}
                                        />

                                        <input
                                            type="text"
                                            name="supplierName"
                                            value={formData.supplierName}
                                            onChange={handleHeaderChange}
                                            required
                                        />

                                        <input
                                            type="text"
                                            name="invoiceNo"
                                            value={formData.invoiceNo}
                                            onChange={handleHeaderChange}
                                            required
                                        />

                                        <input
                                            type="date"
                                            name="invoiceDate"
                                            value={formData.invoiceDate}
                                            onChange={handleHeaderChange}
                                            required
                                        />
                                    </div>
                                </div>

                                { }
                                <div className={styles.formSection}>
                                    <h3 className={styles.sectionTitle}>{t('Product Details')}</h3>

                                    <div className={styles.productTableWrapper}>

                                        { }
                                        <div className={styles.productRowHeader}>
                                            <span>{t('Category')}</span>
                                            <span>{t('Product')}</span>
                                            <span>{t('Qty')}</span>
                                            <span>{t('Rate')}</span>
                                            <span>{t('MRP')}</span>
                                            <span>{t('Expiry')}</span>
                                            <span>{t('Batch')}</span>
                                            <span>{t('Action')}</span>
                                        </div>

                                        { }
                                        {formData.items.map((item, index) => (
                                            <div key={index} className={styles.productRow}>

                                                <select
                                                    name="category"
                                                    value={item.category}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                >
                                                    <option value="">{t('Select')}</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.name}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>

                                                <select
                                                    name="product"
                                                    value={item.product}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                    disabled={!item.category}
                                                >
                                                    <option value="">
                                                        {item.category ? t('Select Product') : t('Select Category first')}
                                                    </option>
                                                    {(productsByCategory[item.category] || []).map(prod => (
                                                        <option key={prod._id} value={prod._id}>
                                                            {prod.name}
                                                        </option>
                                                    ))}
                                                </select>

                                                <input
                                                    type="number"
                                                    name="quantity"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                />

                                                <input
                                                    type="number"
                                                    name="purchaseRate"
                                                    value={item.purchaseRate}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                />

                                                <input
                                                    type="number"
                                                    name="mrp"
                                                    value={item.mrp}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                />

                                                <input
                                                    type="date"
                                                    name="expiryDate"
                                                    value={item.expiryDate}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                />

                                                <input
                                                    type="text"
                                                    name="batchNo"
                                                    value={item.batchNo}
                                                    onChange={(e) => handleItemChange(index, e)}
                                                />

                                                <button type="button" className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => removeItem(index)}>
                                                    <img src={deleteIcon} alt="Delete" width="25" />
                                                </button>

                                            </div>
                                        ))}

                                    </div>

                                    <button
                                        type="button"
                                        onClick={addNewItem}
                                        style={{
                                            background: '#e0e7ff',
                                            color: '#3730a3',
                                            border: 'none',
                                            padding: '0.6rem 1rem',
                                            borderRadius: '6px'
                                        }}
                                    >
                                        {t('+ Add Another Product')}
                                    </button>
                                </div>

                                { }
                                <div className={styles.formActions}>
                                    <button
                                        type="button"
                                        className={styles.cancelBtn}
                                        onClick={() => navigate('/purchaseScreen')}
                                    >
                                        {t('Cancel')}
                                    </button>

                                    <button
                                        type="submit"
                                        className={styles.saveBtn}
                                    >
                                        {t('Save Purchase')}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EditPurchase;
