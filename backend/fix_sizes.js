const db = require('./db');

async function run() {
  try {
    const res = await db.query('SELECT id, sizes FROM products WHERE sizes IS NOT NULL');
    for(let row of res.rows){ 
      if (row.sizes && row.sizes.length > 0) { 
        let modified = false; 
        row.sizes.forEach(s => { 
          if (!s.value || s.value === '') { 
            s.value = s.label; 
            modified = true; 
          } 
        }); 
        if (modified) { 
          await db.query('UPDATE products SET sizes = $1 WHERE id = $2', [JSON.stringify(row.sizes), row.id]); 
          console.log('Fixed sizes for product id '+row.id); 
        } 
      } 
    } 
    console.log('Done');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
