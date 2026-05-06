const supabase = require('../config/supabase');

const TABLE = 'products';

// Generate slug from name + random suffix
function generateSlug(name, id) {
  const suffix = id ? id.slice(-4) : Math.random().toString(36).slice(-4);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + suffix;
}

// Map DB row (snake_case) → API response (camelCase) to match existing frontend expectations
function toApiFormat(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.short_description,
    price: Number(row.price),
    discountPrice: row.discount_price ? Number(row.discount_price) : undefined,
    category: row.category,
    material: row.material,
    occasion: row.occasion || [],
    colors: row.colors || [],
    images: row.images || [],
    videoUrl: row.video_url,
    wornImageUrl: row.worn_image_url,
    stock: row.stock,
    sizes: row.sizes || [],
    isFeatured: row.is_featured,
    isActive: row.is_active,
    tags: row.tags || [],
    deliveryTime: row.delivery_time,
    returnPolicy: row.return_policy,
    ratings: {
      average: Number(row.ratings_average) || 0,
      count: row.ratings_count || 0
    },
    soldCount: row.sold_count,
    instagramReelUrl: row.instagram_reel_url,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Virtual: discount percentage
    discountPercent: (row.discount_price && row.price > row.discount_price)
      ? Math.round(((row.price - row.discount_price) / row.price) * 100)
      : 0
  };
}

// Map API input (camelCase) → DB columns (snake_case)
function toDbFormat(body) {
  const mapped = {};
  if (body.name !== undefined) mapped.name = body.name;
  if (body.slug !== undefined) mapped.slug = body.slug;
  if (body.description !== undefined) mapped.description = body.description;
  if (body.shortDescription !== undefined) mapped.short_description = body.shortDescription;
  if (body.price !== undefined) mapped.price = body.price;
  if (body.discountPrice !== undefined) mapped.discount_price = body.discountPrice;
  if (body.category !== undefined) mapped.category = body.category;
  if (body.material !== undefined) mapped.material = body.material;
  if (body.occasion !== undefined) mapped.occasion = body.occasion;
  if (body.colors !== undefined) mapped.colors = body.colors;
  if (body.images !== undefined) mapped.images = body.images;
  if (body.videoUrl !== undefined) mapped.video_url = body.videoUrl;
  if (body.wornImageUrl !== undefined) mapped.worn_image_url = body.wornImageUrl;
  if (body.stock !== undefined) mapped.stock = body.stock;
  if (body.sizes !== undefined) mapped.sizes = body.sizes;
  if (body.isFeatured !== undefined) mapped.is_featured = body.isFeatured;
  if (body.isActive !== undefined) mapped.is_active = body.isActive;
  if (body.tags !== undefined) mapped.tags = body.tags;
  if (body.deliveryTime !== undefined) mapped.delivery_time = body.deliveryTime;
  if (body.returnPolicy !== undefined) mapped.return_policy = body.returnPolicy;
  if (body.ratings?.average !== undefined) mapped.ratings_average = body.ratings.average;
  if (body.ratings?.count !== undefined) mapped.ratings_count = body.ratings.count;
  if (body.soldCount !== undefined) mapped.sold_count = body.soldCount;
  if (body.instagramReelUrl !== undefined) mapped.instagram_reel_url = body.instagramReelUrl;
  if (body.seoTitle !== undefined) mapped.seo_title = body.seoTitle;
  if (body.seoDescription !== undefined) mapped.seo_description = body.seoDescription;
  return mapped;
}

const Product = {
  toApiFormat,
  toDbFormat,
  generateSlug,

  async create(body) {
    const dbData = toDbFormat(body);
    // Insert first to get the ID, then generate slug
    const { data, error } = await supabase
      .from(TABLE)
      .insert(dbData)
      .select()
      .single();
    if (error) throw error;

    // Generate slug using the ID
    const slug = generateSlug(data.name, data.id);
    const { data: updated, error: updateErr } = await supabase
      .from(TABLE)
      .update({ slug })
      .eq('id', data.id)
      .select()
      .single();
    if (updateErr) throw updateErr;
    return toApiFormat(updated);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toApiFormat(data) : null;
  },

  async findBySlug(slug) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? toApiFormat(data) : null;
  },

  async findFeatured(limit = 8) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, name, slug, price, discount_price, images, category, ratings_average, ratings_count')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(toApiFormat);
  },

  async findWithFilters({ category, color, material, occasion, minPrice, maxPrice, sort, search, featured, page = 1, limit = 20 }) {
    let query = supabase.from(TABLE).select('*', { count: 'exact' }).eq('is_active', true);

    if (category) query = query.eq('category', category);
    if (material) query = query.eq('material', material);
    if (occasion) query = query.contains('occasion', [occasion]);
    if (color) query = query.contains('colors', [color]);
    if (featured === 'true') query = query.eq('is_featured', true);

    // Price filtering — use the effective price (discount_price if exists, otherwise price)
    if (minPrice) query = query.gte('price', Number(minPrice));
    if (maxPrice) query = query.lte('price', Number(maxPrice));

    // Full-text search
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sorting
    const sortMap = {
      'price-asc': { column: 'price', ascending: true },
      'price-desc': { column: 'price', ascending: false },
      'newest': { column: 'created_at', ascending: false },
      'popular': { column: 'sold_count', ascending: false },
      'rating': { column: 'ratings_average', ascending: false }
    };
    const sortConfig = sortMap[sort] || { column: 'created_at', ascending: false };
    query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

    // Pagination
    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      products: (data || []).map(toApiFormat),
      pagination: {
        total: count || 0,
        page: Number(page),
        pages: Math.ceil((count || 0) / Number(limit)),
        limit: Number(limit)
      }
    };
  },

  async countActive() {
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    if (error) throw error;
    return count || 0;
  },

  async update(id, body) {
    const dbData = toDbFormat(body);
    dbData.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data ? toApiFormat(data) : null;
  },

  async softDelete(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data ? toApiFormat(data) : null;
  },

  // Decrement stock and increment sold count
  async decrementStock(id, quantity) {
    // Use raw rpc or two-step: read then update
    const { data: product, error: readErr } = await supabase
      .from(TABLE)
      .select('stock, sold_count')
      .eq('id', id)
      .single();
    if (readErr) throw readErr;

    const { error } = await supabase
      .from(TABLE)
      .update({
        stock: (product.stock || 0) - quantity,
        sold_count: (product.sold_count || 0) + quantity
      })
      .eq('id', id);
    if (error) throw error;
  }
};

module.exports = Product;
