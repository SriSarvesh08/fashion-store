const prisma = require('../config/db');

// Generate slug from name + random suffix
function generateSlug(name, id) {
  const suffix = id ? id.slice(-4) : Math.random().toString(36).slice(-4);
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + suffix;
}

// Map DB row to API response
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
      ? Math.round(((Number(row.price) - Number(row.discount_price)) / Number(row.price)) * 100)
      : 0
  };
}

// Map API input to DB columns
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
    const data = await prisma.product.create({ data: dbData });

    const slug = generateSlug(data.name, data.id);
    const updated = await prisma.product.update({
      where: { id: data.id },
      data: { slug }
    });
    return toApiFormat(updated);
  },

  async findById(id) {
    const data = await prisma.product.findUnique({ where: { id } });
    return data ? toApiFormat(data) : null;
  },

  async findBySlug(slug) {
    const data = await prisma.product.findFirst({
      where: { slug, is_active: true }
    });
    return data ? toApiFormat(data) : null;
  },

  async findFeatured(limit = 8) {
    const data = await prisma.product.findMany({
      where: { is_featured: true, is_active: true },
      orderBy: { created_at: 'desc' },
      take: limit,
      select: {
        id: true, name: true, slug: true, price: true, discount_price: true,
        images: true, category: true, ratings_average: true, ratings_count: true
      }
    });
    return data.map(toApiFormat);
  },

  async findWithFilters({ category, color, material, occasion, minPrice, maxPrice, sort, search, featured, page = 1, limit = 20 }) {
    const where = { is_active: true };

    if (category) where.category = category;
    if (material) where.material = material;
    if (occasion) where.occasion = { has: occasion };
    if (color) where.colors = { has: color };
    if (featured === 'true') where.is_featured = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const sortMap = {
      'price-asc': { price: 'asc' },
      'price-desc': { price: 'desc' },
      'newest': { created_at: 'desc' },
      'popular': { sold_count: 'desc' },
      'rating': { ratings_average: 'desc' }
    };
    const orderBy = sortMap[sort] || { created_at: 'desc' };

    const skip = (Number(page) - 1) * Number(limit);

    const [data, count] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: Number(limit) }),
      prisma.product.count({ where })
    ]);

    return {
      products: data.map(toApiFormat),
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / Number(limit)),
        limit: Number(limit)
      }
    };
  },

  async countActive() {
    return await prisma.product.count({ where: { is_active: true } });
  },

  async update(id, body) {
    const dbData = toDbFormat(body);
    dbData.updated_at = new Date();
    const data = await prisma.product.update({ where: { id }, data: dbData });
    return data ? toApiFormat(data) : null;
  },

  async softDelete(id) {
    const data = await prisma.product.update({
      where: { id },
      data: { is_active: false, updated_at: new Date() }
    });
    return data ? toApiFormat(data) : null;
  },

  async decrementStock(id, quantity) {
    await prisma.product.update({
      where: { id },
      data: {
        stock: { decrement: quantity },
        sold_count: { increment: quantity }
      }
    });
  }
};

module.exports = Product;
