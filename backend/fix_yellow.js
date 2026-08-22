const db = require('./db');
async function run() {
  try {
    const r = await db.query('SELECT id, images FROM products WHERE id=9');
    let images = r.rows[0].images; 
    images[0].sizes = {'S': 10, 'M': 10, 'L': 10, 'XL': 10}; 
    await db.query('UPDATE products SET images = $1 WHERE id = $2', [JSON.stringify(images), 9]); 
    console.log('Fixed');
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
