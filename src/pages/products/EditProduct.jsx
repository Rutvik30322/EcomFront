import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, createProduct, updateProduct } from '../../store/slices/productSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchBrands } from '../../store/slices/brandSlice';
import { uploadService } from '../../services/api';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import ImagePreviewModal from '../../components/ui/ImagePreviewModal';
import styles from './Products.module.css';

const EditProduct = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector(state => state.products);
  const { items: categoriesFromStore } = useSelector(state => state.categories);
  const { items: brandsFromStore } = useSelector(state => state.brands);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    actualPrice: '',
    discountPercent: '',
    category: '',
    brand: '',
    rating: '',
    inStock: true,
    stock: '',
    weight: '',
    ingredients: '',
    nutrition: '',
    allergenWarning: '',
    image: '',
    images: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingAdditionalImages, setUploadingAdditionalImages] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const isEditMode = id && id !== 'new';
  const isUploading = uploadingMainImage || uploadingAdditionalImages;

  useEffect(() => {

    dispatch(fetchCategories(false));
    dispatch(fetchBrands());
    if (isEditMode) {
      dispatch(fetchProducts());
    }
  }, [dispatch, isEditMode]);

  useEffect(() => {
    if (categoriesFromStore && categoriesFromStore.length > 0) {
      setCategories(categoriesFromStore);
    }
  }, [categoriesFromStore]);

  useEffect(() => {
    if (brandsFromStore && brandsFromStore.length > 0) {
      setBrands(brandsFromStore);
    }
  }, [brandsFromStore]);

  useEffect(() => {
    if (isEditMode && products.length > 0) {
      const product = products.find(p => p._id === id);
      if (product) {
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          actualPrice: product.actualPrice || '',
          discountPercent: product.discountPercent || '',
          category: product.category || '',
          brand: product.brand || '',
          slug: product.slug || '',
          rating: product.rating || '',
          inStock: typeof product.inStock !== 'undefined' ? product.inStock : true,
          stock: product.stock || '',
          weight: product.weight || '',
          ingredients: Array.isArray(product.ingredients) ? product.ingredients.join(', ') : (product.ingredients || ''),
          nutrition: product.nutrition || '',
          allergenWarning: product.allergenWarning || '',
          image: product.image || '',
          images: Array.isArray(product.images) ? [...product.images] : []
        });
      }
    } else if (!isEditMode) {

      setFormData({
        name: '',
        description: '',
        price: '',
        actualPrice: '',
        discountPercent: '',
        category: '',
        brand: '',
        rating: '',
        inStock: true,
        stock: '',
        weight: '',
        ingredients: '',
        nutrition: '',
        allergenWarning: '',
        image: '',
        images: []
      });
    }
  }, [id, products, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => {
      const nextData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      if (name === 'actualPrice' || name === 'discountPercent') {
        const actualP = parseFloat(nextData.actualPrice) || 0;
        const discountP = parseFloat(nextData.discountPercent) || 0;

        // Auto calculate discounted price
        if (actualP >= 0 && discountP >= 0 && discountP <= 100) {
          const calcPrice = actualP - (actualP * discountP / 100);
          nextData.price = calcPrice.toFixed(2);
        } else if (actualP >= 0 && !nextData.discountPercent) {
          nextData.price = actualP.toFixed(2);
        }
      }

      return nextData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData = { ...formData };

      if (productData.ingredients && typeof productData.ingredients === 'string') {
        productData.ingredients = productData.ingredients.split(',').map(item => item.trim()).filter(item => item);
      }

      const imageValue = productData.image;
      const isValidImageUrl = imageValue &&
        typeof imageValue === 'string' &&
        imageValue.trim() !== '' &&
        imageValue.trim() !== '🍫' &&
        (imageValue.startsWith('http://') || imageValue.startsWith('https://'));

      if (isValidImageUrl) {
        productData.image = imageValue.trim();
      } else {
        delete productData.image;
      }

      if (productData.images && Array.isArray(productData.images) && productData.images.length > 0) {
        const validImages = productData.images.filter(img =>
          img &&
          typeof img === 'string' &&
          img.trim() !== '' &&
          img.trim() !== '🍫' &&
          (img.startsWith('http://') || img.startsWith('https://'))
        );

        if (validImages.length > 0) {
          productData.images = validImages;
        } else {
          delete productData.images;
        }
      } else {
        delete productData.images;
      }

      if (isEditMode) {
        await dispatch(updateProduct({ id, productData }));
      } else {
        await dispatch(createProduct(productData));
      }

      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdditionalImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingAdditionalImages(true);
    try {
      const uploadResponse = await uploadService.uploadProductImages(files);

      if (uploadResponse.data &&
        uploadResponse.data.data &&
        uploadResponse.data.data.imageUrls &&
        uploadResponse.data.data.imageUrls.length > 0) {
        const imageUrls = uploadResponse.data.data.imageUrls;

        const validImageUrls = imageUrls.filter(url =>
          url && typeof url === 'string' &&
          (url.startsWith('http://') || url.startsWith('https://'))
        );

        if (validImageUrls.length > 0) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...validImageUrls]
          }));
          e.target.value = '';
          alert(`${validImageUrls.length} additional image(s) uploaded successfully!`);
        } else {
          alert('Error: No valid image URLs received from server');
        }
      } else {
        alert('Error: No image URLs received from server');
      }
    } catch (error) {
      console.error('Error uploading additional images:', error);
      alert('Error uploading images: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploadingAdditionalImages(false);
    }
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadingMainImage(true);
      try {
        const uploadResponse = await uploadService.uploadProductImages([file]);

        if (uploadResponse.data &&
          uploadResponse.data.data &&
          uploadResponse.data.data.imageUrls &&
          uploadResponse.data.data.imageUrls.length > 0) {
          const imageUrl = uploadResponse.data.data.imageUrls[0];

          if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
            setFormData(prev => ({
              ...prev,
              image: imageUrl
            }));
            e.target.value = '';
            alert('Main image uploaded successfully!');
          } else {
            alert('Error: Invalid image URL received from server');
          }
        } else {
          alert('Error: No image URL received from server');
        }
      } catch (error) {
        console.error('Error uploading main image:', error);
        alert('Error uploading image: ' + (error.response?.data?.message || error.message));
      } finally {
        setUploadingMainImage(false);
      }
    }
  };

  if (loading && !isEditMode) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={styles.mainContent}>
          <div className={styles.loading}>{t('Loading...')}</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <LoadingOverlay
        show={isLoading || uploadingMainImage || uploadingAdditionalImages}
        message={
          uploadingMainImage ? t('Uploading main image...') :
            uploadingAdditionalImages ? t('Uploading images...') :
              isLoading ? (isEditMode ? t('Updating product...') : t('Creating product...')) :
                t('Loading...')
        }
      />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className={`${styles.mainContent} ${!sidebarOpen ? styles.mainContentExpanded : ''}`}>
        <Header
          title={isEditMode ? t('Edit Product') : t('Add New Product')}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className={styles.dashboardContent}>
          <div className={styles.formPageContainer}>
            { }
            <button
              className={styles.backButton}
              onClick={() => navigate('/products')}
            >
              {t('← Back to Products')}
            </button>

            <div className={styles.formContainer}>
              <h2 className={styles.formTitle}>
                {isEditMode ? t('Edit Product') : t('Add New Product')}
              </h2>

              <form onSubmit={handleSubmit} className={styles.productForm}>
                {isEditMode && formData.slug && (
                  <div className={styles.formSection} style={{ padding: '1.5rem 2rem', marginBottom: '1rem', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div className={styles.formGroup}>
                      <label style={{ color: '#166534', marginBottom: '0.25rem' }}>{t('Product SKU / Unique Code')}</label>
                      <div style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 'bold', color: '#15803d', letterSpacing: '1px' }}>
                        {formData.slug}
                      </div>
                    </div>
                  </div>
                )}
                { }
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>{t('Basic Information')}</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup} style={{ marginLeft: '0.5rem' }}>
                      <label htmlFor="category">{t('Category *')}</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">{t('Select a category')}</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                      {categories.length === 0 && (
                        <small className={styles.helpText}>
                          {t('No categories available. Please add categories first.')}
                        </small>
                      )}
                    </div>

                    <div className={styles.formGroup} style={{ marginLeft: '0.5rem' }}>
                      <label htmlFor="brand">{t('Brand *')}</label>
                      <select
                        id="brand"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">{t('Select a brand')}</option>
                        {brands.map((b) => (
                          <option key={b._id} value={b.brandName}>
                            {b.brandName}
                          </option>
                        ))}
                      </select>
                      {brands.length === 0 && (
                        <small className={styles.helpText}>
                          {t('No brands available. Please add brands first.')}
                        </small>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="name">{t('Product Name *')}</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder={t("Enter product name")}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                  <label htmlFor="description">{t('Description *')}</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    placeholder={t("Enter product description")}
                    rows="4"
                  />
                </div>

                { }
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>{t('Pricing & Stock')}</h3>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="price">{t('Actual Price (MRP) (₹) *')}</label>
                      <input
                        type="number"
                        id="actualPrice"
                        name="actualPrice"
                        value={formData.actualPrice}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="discountPercent">{t('Discount Percent (%)')}</label>
                      <input
                        type="number"
                        id="discountPercent"
                        name="discountPercent"
                        value={formData.discountPercent}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0.0"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="price">{t('Discounted Price (Selling Price) (₹) *')} <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 'normal' }}>({t('Auto-calculated')})</span></label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        readOnly
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#4b5563' }}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="stock">{t('Stock Quantity *')}</label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="0"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="rating">{t('Rating')}</label>
                      <input
                        type="number"
                        id="rating"
                        name="rating"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formData.rating}
                        onChange={handleInputChange}
                        placeholder="0.0"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="weight">{t('Weight')}</label>
                      <input
                        type="text"
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleInputChange}
                        placeholder={t("e.g., 100g")}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="inStock"
                        checked={formData.inStock}
                        onChange={handleInputChange}
                      />
                      <span>{t('Product is in stock')}</span>
                    </label>
                  </div>
                </div>

                { }
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>{t('Additional Details')}</h3>
                  <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                    <label htmlFor="ingredients">{t('Ingredients (comma separated)')}</label>
                    <textarea
                      id="ingredients"
                      name="ingredients"
                      value={formData.ingredients}
                      onChange={handleInputChange}
                      placeholder={t("e.g., Cocoa beans, Sugar, Milk")}
                      rows="3"
                    />
                  </div>

                  <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                    <label htmlFor="nutrition">{t('Nutrition Facts')}</label>
                    <textarea
                      id="nutrition"
                      name="nutrition"
                      value={formData.nutrition}
                      onChange={handleInputChange}
                      placeholder={t("Enter nutrition details")}
                      rows="3"
                    />
                  </div>

                  <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                    <label htmlFor="allergenWarning">{t('Allergen Warning')}</label>
                    <textarea
                      id="allergenWarning"
                      name="allergenWarning"
                      value={formData.allergenWarning}
                      onChange={handleInputChange}
                      placeholder={t("Enter allergen warnings")}
                      rows="2"
                    />
                  </div>
                </div>

                { }
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>{t('Product Images')}</h3>

                  { }
                  <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
                    <label htmlFor="mainImageUpload">{t('Main Image *')}</label>
                    <input
                      type="file"
                      id="mainImageUpload"
                      name="mainImageUpload"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                    />
                    {formData.image && formData.image !== '🍫' && (
                      <div style={{ marginTop: '1rem', border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '8px', display: 'inline-block', backgroundColor: '#f9fafb' }}>
                        <img
                          src={formData.image}
                          alt="Main Preview"
                          style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={() => setPreviewImage(formData.image)}
                        />
                        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                          <button type="button" onClick={() => setFormData(p => ({ ...p, image: '' }))} style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>{t('Remove')}</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.formGroup} style={{ marginTop: '2rem' }}>
                    <label htmlFor="additionalImagesUpload">{t('Additional Images')}</label>
                    <input
                      type="file"
                      id="additionalImagesUpload"
                      name="additionalImagesUpload"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalImageUpload}
                    />
                    {formData.images && formData.images.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {formData.images.map((imgUrl, idx) => (
                          <div key={idx} style={{ border: '1px solid #e5e7eb', padding: '0.5rem', borderRadius: '8px', display: 'inline-block', backgroundColor: '#f9fafb' }}>
                            <img
                              src={imgUrl}
                              alt={`Preview ${idx + 1}`}
                              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={() => setPreviewImage(imgUrl)}
                            />
                            <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                              <button type="button" onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))} style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>{t('Remove')}</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => navigate('/products')}>
                    {t('Cancel')}
                  </button>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={isLoading || isUploading}
                  >
                    {isLoading ? t('Saving...') : isUploading ? t('Uploading images...') : (isEditMode ? t('Update Product') : t('Save Product'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default EditProduct;
