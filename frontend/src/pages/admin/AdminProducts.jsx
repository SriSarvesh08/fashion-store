import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, X } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { productsApi, uploadApi, getImageUrl } from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=80&h=80&fit=crop';
const CATEGORIES = ['earrings','hair-clips','bangles','chains','rings','necklaces','bracelets','other'];
const MATERIALS = ['gold','silver','rose-gold','oxidised','fabric','beaded','pearl','crystal','other'];

const EMPTY_FORM = {
  name: '', description: '', shortDescription: '', price: '', discountPrice: '',
  category: 'earrings', material: 'gold', stock: 100, deliveryTime: '3-5 business days',
  returnPolicy: '7-day easy return & exchange', isFeatured: false, isActive: true,
  images: [{ url: '', alt: '' }], tags: '', colors: '', occasion: []
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const res = await uploadApi.images(files);
      setForm(f => ({
        ...f,
        images: [...f.images.filter(img => img.url), ...res.data.images]
      }));
      toast.success(`${files.length} image(s) uploaded!`);
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setForm(f => ({
      ...f,
      images: f.images.filter((_, i) => i !== index)
    }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.getAll({ search, limit: 50 });
      setProducts(res.data.products);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...p,
      tags: p.tags?.join(', ') || '',
      colors: p.colors?.join(', ') || '',
      images: p.images?.length ? p.images : [{ url: '', alt: '' }]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await productsApi.delete(id);
      toast.success('Product deactivated');
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price, category are required'); return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
        stock: Number(form.stock),
        tags: typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : form.tags,
        colors: typeof form.colors === 'string' ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : form.colors,
        images: form.images.filter(img => img.url.trim())
      };

      if (editing) {
        await productsApi.update(editing._id, payload);
        toast.success('Product updated');
      } else {
        await productsApi.create(payload);
        toast.success('Product created');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const updateImage = (i, field, value) => {
    setForm(f => {
      const imgs = [...f.images];
      imgs[i] = { ...imgs[i], [field]: value };
      return { ...f, images: imgs };
    });
  };

  return (
    <AdminSidebar>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl text-gray-800">Products</h1>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm py-2.5">
            <Plus size={16} /> Add Product
          </button>
        </div>

        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..." className="input pl-9 text-sm py-2" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-body font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-gray-400 font-body">No products yet. Add your first product!</td></tr>
                  ) : products.map(p => (
                    <tr key={p._id} className="hover:bg-blush-50/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={getImageUrl(p.images?.[0]?.url) || PLACEHOLDER} alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg bg-blush-50 flex-shrink-0"
                            onError={e => { e.target.src = PLACEHOLDER; }} />
                          <div>
                            <p className="text-sm font-body font-medium text-gray-700 line-clamp-1">{p.name}</p>
                            {p.isFeatured && <span className="badge bg-blush-100 text-blush-700 text-[10px]">Featured</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-body text-gray-500 capitalize">{p.category?.replace('-', ' ')}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-body font-semibold text-gray-700">₹{(p.discountPrice || p.price)?.toLocaleString('en-IN')}</p>
                        {p.discountPrice && <p className="text-xs text-gray-400 line-through font-body">₹{p.price?.toLocaleString('en-IN')}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-body font-medium ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blush-600 hover:bg-blush-50 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(p._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl my-4 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-body font-semibold text-gray-800">{editing ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Product Name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. Gold Hoop Earrings" />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Category *</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input">
                      {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.replace('-', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Material</label>
                    <select value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} className="input">
                      {MATERIALS.map(m => <option key={m} value={m} className="capitalize">{m.replace('-', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input" placeholder="499" />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Discount Price (₹)</label>
                    <input type="number" value={form.discountPrice} onChange={e => setForm(f => ({ ...f, discountPrice: e.target.value }))} className="input" placeholder="399" />
                  </div>
                  <div>
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Stock</label>
                    <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Description *</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="input resize-none" placeholder="Describe the product..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Colors (comma-separated)</label>
                    <input value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))} className="input" placeholder="Gold, Silver, Rose Gold" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-body font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="input" placeholder="trending, new, party" />
                  </div>
                  {/* Images */}
                  <div className="col-span-2">
                    <label className="block text-sm font-body font-medium text-gray-700 mb-2">Product Images</label>
                    
                    {/* Uploaded previews with color assignment */}
                    {form.images.filter(img => img.url).length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-3">
                        {form.images.filter(img => img.url).map((img, i) => (
                          <div key={i} className="relative group">
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-blush-200">
                              <img src={getImageUrl(img.url)} alt={img.alt || ''} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeImage(i)}
                                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} />
                              </button>
                            </div>
                            <select
                              value={img.color || ''}
                              onChange={e => {
                                const imgs = [...form.images];
                                imgs[i] = { ...imgs[i], color: e.target.value };
                                setForm(f => ({ ...f, images: imgs }));
                              }}
                              className="mt-1 w-20 text-[10px] border border-gray-200 rounded-lg px-1 py-0.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blush-300"
                            >
                              <option value="">Color</option>
                              {(typeof form.colors === 'string' ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : form.colors || []).map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    <label className={`flex flex-col items-center justify-center border-2 border-dashed border-blush-300 rounded-xl p-6 cursor-pointer
                      hover:border-blush-500 hover:bg-blush-50/50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload size={24} className="text-blush-400 mb-2" />
                      <span className="text-sm font-body text-gray-500">
                        {uploading ? 'Uploading...' : 'Click to upload images'}
                      </span>
                      <span className="text-xs font-body text-gray-400 mt-1">JPEG, PNG, WebP • Max 5MB each</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="col-span-2 flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="accent-blush-600 w-4 h-4" />
                      <span className="text-sm font-body text-gray-700">Featured Product</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-blush-600 w-4 h-4" />
                      <span className="text-sm font-body text-gray-700">Active (visible to customers)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowForm(false)} className="btn-outline flex-1 py-2.5">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
}
