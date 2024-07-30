const mysql = require('mysql');

const Database = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  port : 3306,
  password: '', 
  database: 'e_commerce' 
});

Database.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database as ID', Database.threadId);
});

module.exports = Database;