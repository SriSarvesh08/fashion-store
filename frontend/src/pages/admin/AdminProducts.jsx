import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Search, X, Image as ImageIcon, Upload } from 'lucide-react';
import { productsApi, getImageUrl, uploadApi } from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const CATEGORIES = ['earrings', 'hair-clips', 'bangles', 'chains', 'rings', 'necklaces', 'bracelets', 'dresses'];
const MATERIALS = ['gold', 'silver', 'rose-gold', 'oxidised', 'fabric', 'pearl', 'crystal'];
const DRESS_FITS = ['regular', 'slim', 'flared', 'bodycon', 'a-line', 'wrap', 'shift', 'other'];
const DRESS_LENGTHS = ['mini', 'midi', 'maxi', 'knee-length', 'ankle-length'];

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [uploadingImageIdx, setUploadingImageIdx] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: '',
    discount_price: '',
    category: 'earrings',
    material: '',
    fabric: '',
    fit: '',
    length: '',
    care_instructions: '',
    model_height: '',
    colors: '', // string for textarea
    tags: '', // string for textarea
    occasion: '', // string for textarea
    stock: 0,
    is_featured: false,
    is_active: true,
    sizes: [], // array of objects
    images: [] // array of objects
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productsApi.getAll({ limit: 100 });
      setProducts(res.data.products);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      name: '', slug: '', description: '', short_description: '',
      price: '', discount_price: '', category: 'earrings', material: '',
      fabric: '', fit: '', length: '', care_instructions: '', model_height: '',
      colors: '', tags: '', occasion: '', stock: 0,
      is_featured: false, is_active: true, sizes: [], images: [{url: '', alt: '', is_front: true, color: '', sizes: []}]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setFormData({
      ...product,
      colors: product.colors ? product.colors.join(', ') : '',
      tags: product.tags ? product.tags.join(', ') : '',
      occasion: product.occasion ? product.occasion.join(', ') : '',
      images: product.images?.length > 0 ? product.images.map(img => ({ ...img, sizes: img.sizes || [] })) : [{url: '', alt: '', is_front: true, color: '', sizes: []}],
      sizes: product.sizes || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Format arrays
      const payload = { ...formData };
      payload.colors = payload.colors ? payload.colors.split(',').map(s => s.trim()).filter(Boolean) : [];
      payload.tags = payload.tags ? payload.tags.split(',').map(s => s.trim()).filter(Boolean) : [];
      payload.occasion = payload.occasion ? payload.occasion.split(',').map(s => s.trim()).filter(Boolean) : [];
      payload.price = parseFloat(payload.price);
      payload.discount_price = payload.discount_price ? parseFloat(payload.discount_price) : null;
      payload.stock = parseInt(payload.stock, 10);

      // Clean up dress specific fields if not dresses
      if (payload.category !== 'dresses') {
        payload.fabric = null;
        payload.fit = null;
        payload.length = null;
        payload.care_instructions = null;
        payload.model_height = null;
      }

      if (editingId) {
        await productsApi.update(editingId, payload);
        toast.success('Product updated');
      } else {
        await productsApi.create(payload);
        toast.success('Product created');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Image handlers
  const handleImageChange = (index, field, value) => {
    const newImages = [...formData.images];
    newImages[index][field] = value;
    setFormData({ ...formData, images: newImages });
  };
  const addImage = () => {
    setFormData({ ...formData, images: [...formData.images, { url: '', alt: '', is_front: false, color: '', sizes: [] }] });
  };
  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleFileUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImageIdx(index);
    try {
      const res = await uploadApi.images([file]);
      const { url, alt } = res.data.images[0];
      const newImages = [...formData.images];
      newImages[index].url = url;
      // Only set alt if it's currently empty
      if (!newImages[index].alt) newImages[index].alt = alt;
      setFormData({ ...formData, images: newImages });
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImageIdx(null);
    }
  };

  // Size handlers
  const handleSizeChange = (index, field, value) => {
    const newSizes = [...formData.sizes];
    newSizes[index][field] = value;
    if (field === 'label' && !newSizes[index].value) {
      newSizes[index].value = value;
    }
    setFormData({ ...formData, sizes: newSizes });
  };
  const addSize = () => {
    setFormData({ ...formData, sizes: [...formData.sizes, { label: '', value: '' }] });
  };
  const removeSize = (index) => {
    const newSizes = formData.sizes.filter((_, i) => i !== index);
    setFormData({ ...formData, sizes: newSizes });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your inventory and catalog</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blush-300 text-sm bg-white"
            />
          </div>
          <button onClick={openCreateModal} className="btn-primary shrink-0 py-2 px-4 flex items-center gap-2">
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center"><Spinner size="md" /></td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const currentPrice = product.discount_price ? parseFloat(product.discount_price) : parseFloat(product.price);
                  const frontImg = product.images?.find(i => i.is_front)?.url || product.images?.[0]?.url;
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={getImageUrl(frontImg) || 'https://via.placeholder.com/40'} 
                            alt={product.name} 
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                          />
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize">{product.category.replace('-', ' ')}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ₹{currentPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {product.stock} left
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {product.is_active ? 
                            <span className="text-xs text-green-600 font-medium">Active</span> : 
                            <span className="text-xs text-gray-400 font-medium">Draft</span>
                          }
                          {product.is_featured && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded w-max font-bold tracking-wide">FEATURED</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(product)} className="p-1.5 text-gray-400 hover:text-blush-600 transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl animate-slide-in flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display text-2xl text-gray-900">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => !saving && setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-8">
              
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-display text-lg border-b pb-2">Basic Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Slug * (Unique URL)</label>
                    <input type="text" required value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="input" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input bg-white">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Material (Non-dresses)</label>
                    <select value={formData.material || ''} onChange={e => setFormData({...formData, material: e.target.value})} className="input bg-white" disabled={formData.category === 'dresses'}>
                      <option value="">None</option>
                      {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input type="number" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Discount Price (₹)</label>
                    <input type="number" min="0" value={formData.discount_price || ''} onChange={e => setFormData({...formData, discount_price: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stock *</label>
                    <input type="number" required min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="input" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Short Description *</label>
                  <input type="text" required value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} className="input" maxLength={150} />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Description</label>
                  <textarea rows="4" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="input"></textarea>
                </div>
              </div>

              {/* Dress Specific (Conditional) */}
              {formData.category === 'dresses' && (
                <div className="space-y-4 bg-blush-50 p-4 rounded-xl border border-blush-100">
                  <h3 className="font-display text-lg text-blush-800 border-b border-blush-200 pb-2">Dress Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fabric</label>
                      <input type="text" value={formData.fabric || ''} onChange={e => setFormData({...formData, fabric: e.target.value})} className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Model Height</label>
                      <input type="text" value={formData.model_height || ''} onChange={e => setFormData({...formData, model_height: e.target.value})} className="input" placeholder="e.g. 5'7 wearing size S" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fit</label>
                      <select value={formData.fit || ''} onChange={e => setFormData({...formData, fit: e.target.value})} className="input bg-white">
                        <option value="">Select Fit</option>
                        {DRESS_FITS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Length</label>
                      <select value={formData.length || ''} onChange={e => setFormData({...formData, length: e.target.value})} className="input bg-white">
                        <option value="">Select Length</option>
                        {DRESS_LENGTHS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Care Instructions</label>
                    <textarea rows="2" value={formData.care_instructions || ''} onChange={e => setFormData({...formData, care_instructions: e.target.value})} className="input"></textarea>
                  </div>
                </div>
              )}

              {/* Attributes */}
              <div className="space-y-4">
                <h3 className="font-display text-lg border-b pb-2">Attributes & Tags</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Colors (comma separated)</label>
                    <input type="text" value={formData.colors} onChange={e => setFormData({...formData, colors: e.target.value})} className="input" placeholder="red, blue, gold" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                    <input type="text" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="input" placeholder="bestseller, summer" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Occasion (comma separated)</label>
                    <input type="text" value={formData.occasion} onChange={e => setFormData({...formData, occasion: e.target.value})} className="input" placeholder="wedding, party" />
                  </div>
                </div>

                {/* Sizes Array */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-medium text-gray-700">Sizes</label>
                    <button type="button" onClick={addSize} className="text-xs text-blush-600 font-medium flex items-center gap-1 hover:underline">
                      <Plus size={12}/> Add Size
                    </button>
                  </div>
                  {formData.sizes.map((size, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" placeholder="Label (e.g. Small)" value={size.label} onChange={e => handleSizeChange(idx, 'label', e.target.value)} className="input flex-1" />
                      <input type="text" placeholder="Value (e.g. S)" value={size.value} onChange={e => handleSizeChange(idx, 'value', e.target.value)} className="input flex-1" />
                      <button type="button" onClick={() => removeSize(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {formData.sizes.length === 0 && <p className="text-xs text-gray-400 italic">No sizes added.</p>}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-display text-lg">Images</h3>
                  <button type="button" onClick={addImage} className="text-xs text-blush-600 font-medium flex items-center gap-1 hover:underline">
                    <Plus size={12}/> Add Image URL
                  </button>
                </div>
                
                {formData.images.map((img, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input type="text" placeholder="Image URL (http://...)" required value={img.url} onChange={e => handleImageChange(idx, 'url', e.target.value)} className="input" />
                          <div className="relative shrink-0">
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => handleFileUpload(idx, e)} 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              disabled={uploadingImageIdx === idx}
                            />
                            <button type="button" className="btn-outline py-2 px-3 flex items-center gap-2 whitespace-nowrap bg-white hover:bg-blush-50" disabled={uploadingImageIdx === idx}>
                              {uploadingImageIdx === idx ? <Spinner size="sm" /> : <Upload size={16} />}
                              <span className="hidden sm:inline">{uploadingImageIdx === idx ? 'Uploading...' : 'Upload File'}</span>
                            </button>
                          </div>
                        </div>
                        <input type="text" placeholder="Alt text" value={img.alt} onChange={e => handleImageChange(idx, 'alt', e.target.value)} className="input text-sm mb-2" />
                        <input type="text" placeholder="Color variant (e.g. Red, Optional)" value={img.color || ''} onChange={e => handleImageChange(idx, 'color', e.target.value)} className="input text-sm" />
                        
                        {formData.category === 'dresses' && formData.sizes && formData.sizes.length > 0 && (
                          <div className="mt-2 bg-white p-2 rounded-lg border border-gray-100">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Available Sizes for this Color:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {formData.sizes.map(size => {
                                const sizeMap = img.sizes || {};
                                // Handle legacy array format
                                const stockMap = Array.isArray(sizeMap) 
                                  ? sizeMap.reduce((acc, s) => ({...acc, [s]: 10}), {}) 
                                  : sizeMap;
                                  
                                const stockVal = stockMap[size.value];
                                const hasStock = stockVal !== undefined && stockVal !== null;

                                return (
                                  <div key={size.value} className={`flex items-center gap-2 p-1.5 rounded border transition-colors ${hasStock ? 'bg-blush-50 border-blush-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <span className="text-xs font-medium text-gray-700 w-6">{size.label}</span>
                                    <input 
                                      type="number"
                                      min="0"
                                      placeholder="Qty"
                                      value={hasStock ? stockVal : ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const newStockMap = { ...stockMap };
                                        if (val === '') {
                                          delete newStockMap[size.value];
                                        } else {
                                          newStockMap[size.value] = parseInt(val) || 0;
                                        }
                                        handleImageChange(idx, 'sizes', newStockMap);
                                      }}
                                      className="w-14 h-6 text-xs px-1 py-0 border rounded outline-none focus:ring-1 focus:ring-blush-500"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="w-20 h-20 bg-white border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {img.url ? <img src={getImageUrl(img.url)} alt="preview" className="w-full h-full object-cover" onError={(e) => {e.target.style.display='none'}} /> : <ImageIcon className="text-gray-300" />}
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="is_front" checked={img.is_front} onChange={() => {
                          const newImgs = formData.images.map((i, iIdx) => ({...i, is_front: iIdx === idx}));
                          setFormData({...formData, images: newImgs});
                        }} className="w-3.5 h-3.5 text-blush-600" />
                        <span className="text-xs font-medium text-gray-700">Primary Cover</span>
                      </label>
                      <button type="button" onClick={() => removeImage(idx)} className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1">
                        <Trash2 size={12}/> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="space-y-4 pb-10">
                <h3 className="font-display text-lg border-b pb-2">Visibility</h3>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-blush-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">Active (Visible on store)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_featured} onChange={e => setFormData({...formData, is_featured: e.target.checked})} className="w-4 h-4 text-blush-600 rounded" />
                    <span className="text-sm font-medium text-gray-700">Featured (Show on homepage)</span>
                  </label>
                </div>
              </div>

              {/* Submit fixed at bottom */}
              <div className="sticky bottom-0 -mx-6 -mb-6 mt-8 bg-white border-t border-gray-200 p-4 px-6 flex justify-end gap-3 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline py-2 px-6">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary py-2 px-8 flex items-center gap-2">
                  {saving ? <Spinner size="sm" /> : 'Save Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
