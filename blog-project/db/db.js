const mysql = require('mysql');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '6313391sS',
  database: 'blog'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to the database:', err); //error message in English
    return;
  }
  console.log('Secessfully connected to the database ✅');
});

module.exports = db;
