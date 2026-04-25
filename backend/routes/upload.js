const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const authMiddleware = require('../middleware/auth');

// Use memory storage — files go to Cloudinary, not disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// Helper: upload a buffer to Cloudinary
const uploadToCloudinary = (buffer, mimetype, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'vinoz-fashion',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ─── Upload Images (up to 5 at once) ─────────────────────────────────────
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const uploadPromises = req.files.map(file =>
      uploadToCloudinary(file.buffer, file.mimetype, file.originalname)
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map((result, i) => ({
      url: result.secure_url,           // Full Cloudinary HTTPS URL
      publicId: result.public_id,
      alt: req.files[i].originalname
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]/g, ' ')
    }));

    res.json({ images });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Image upload failed: ' + error.message });
  }
});

module.exports = router;
