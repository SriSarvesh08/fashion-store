const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const TABLE = 'admins';

const Admin = {
  // Find admin by username
  async findByUsername(username) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('username', username)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  // Find admin by ID
  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Create admin (hashes password before saving)
  async create({ username, password, email }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ username, password: hashedPassword, email })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Update admin fields
  async update(id, fields) {
    fields.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Compare password
  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }
};

module.exports = Admin;
