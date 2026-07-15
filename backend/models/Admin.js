const prisma = require('../config/db');
const bcrypt = require('bcryptjs');

const Admin = {
  // Find admin by username
  async findByUsername(username) {
    return await prisma.admin.findUnique({
      where: { username }
    });
  },

  // Find admin by ID
  async findById(id) {
    return await prisma.admin.findUnique({
      where: { id }
    });
  },

  // Create admin (hashes password before saving)
  async create({ username, password, email }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    return await prisma.admin.create({
      data: { username, password: hashedPassword, email }
    });
  },

  // Update admin fields
  async update(id, fields) {
    return await prisma.admin.update({
      where: { id },
      data: fields
    });
  },

  // Compare password
  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
};

module.exports = Admin;
