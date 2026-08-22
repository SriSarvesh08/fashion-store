const db = require('../db');

function generateSlug(name, id) {
  const suffix = id ? id.toString().slice(-4) : Math.random().toString(36).substring(2, 6);
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + suffix;
}

exports.getAllProducts = async (req, res, next) => {
  try {
    const { category, material, fabric, fit, length, occasion, color, minPrice, maxPrice, featured, search, sort, page = 1, limit = 20 } = req.query;

    let conditions = ['is_active = true'];
    const values = [];
    let idx = 1;

    if (category) { conditions.push(`category = $${idx++}`); values.push(category); }
    if (material) { conditions.push(`material = $${idx++}`); values.push(material); }
    if (fabric) { conditions.push(`fabric = $${idx++}`); values.push(fabric); }
    if (fit) { conditions.push(`fit = $${idx++}`); values.push(fit); }
    if (length) { conditions.push(`length = $${idx++}`); values.push(length); }
    if (featured === 'true') { conditions.push(`is_featured = $${idx++}`); values.push(true); }
    if (minPrice) { conditions.push(`price >= $${idx++}`); values.push(parseFloat(minPrice)); }
    if (maxPrice) { conditions.push(`price <= $${idx++}`); values.push(parseFloat(maxPrice)); }
    if (occasion) { conditions.push(`$${idx++} = ANY(occasion)`); values.push(occasion); }
    if (color) { conditions.push(`$${idx++} = ANY(colors)`); values.push(color); }
    
    if (search) {
      conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx+1} OR $${idx+2} = ANY(tags))`);
      values.push(`%${search}%`, `%${search}%`, search);
      idx += 3;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'popular') orderBy = 'ORDER BY sold_count DESC';
    if (sort === 'price-asc') orderBy = 'ORDER BY price ASC';
    if (sort === 'price-desc') orderBy = 'ORDER BY price DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const queryValues = [...values, parseInt(limit), offset];

    const countResult = await db.query(`SELECT COUNT(*) FROM products ${whereClause}`, values);
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(`SELECT * FROM products ${whereClause} ${orderBy} LIMIT $${idx++} OFFSET $${idx++}`, queryValues);

    res.json({
      products: result.rows,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) { next(error); }
};

exports.getProductBySlug = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE slug = $1 AND is_active = true', [req.params.slug]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM products WHERE is_featured = true AND is_active = true ORDER BY created_at DESC LIMIT 8');
    res.json(result.rows);
  } catch (error) { next(error); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const {
      name, description, short_description, price, discount_price, category,
      material, fabric, fit, length, care_instructions, model_height,
      colors, tags, occasion, sizes, images, video_url, worn_image_url,
      stock, is_featured, delivery_time, return_policy
    } = req.body;

    const dummySlug = generateSlug(name);

    const query = `
      INSERT INTO products (
        name, slug, description, short_description, price, discount_price, category,
        material, fabric, fit, length, care_instructions, model_height,
        colors, tags, occasion, sizes, images, video_url, worn_image_url,
        stock, is_featured, delivery_time, return_policy
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING *`;
    
    const values = [
      name, dummySlug, description, short_description, price, discount_price, category,
      material, fabric, fit, length, care_instructions, model_height,
      colors || [], tags || [], occasion || [], sizes ? JSON.stringify(sizes) : null, images ? JSON.stringify(images) : null, video_url, worn_image_url,
      stock || 0, is_featured || false, delivery_time, return_policy
    ];

    const result = await db.query(query, values);
    let product = result.rows[0];

    const realSlug = generateSlug(name, product.id);
    const updateResult = await db.query('UPDATE products SET slug = $1 WHERE id = $2 RETURNING *', [realSlug, product.id]);
    
    res.status(201).json(updateResult.rows[0]);
  } catch (error) { next(error); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const allowedFields = [
      'name', 'description', 'short_description', 'price', 'discount_price', 'category',
      'material', 'fabric', 'fit', 'length', 'care_instructions', 'model_height',
      'colors', 'tags', 'occasion', 'sizes', 'images', 'video_url', 'worn_image_url',
      'stock', 'is_featured', 'is_active', 'delivery_time', 'return_policy'
    ];

    let setClauses = [];
    let values = [];
    let idx = 1;

    for (let key of allowedFields) {
      if (body[key] !== undefined) {
        setClauses.push(`${key} = $${idx++}`);
        if (key === 'sizes' || key === 'images') {
          values.push(JSON.stringify(body[key]));
        } else {
          values.push(body[key]);
        }
      }
    }

    if (setClauses.length === 0) return res.status(400).json({ error: 'No fields to update' });

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const result = await db.query('UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product soft deleted' });
  } catch (error) { next(error); }
};
