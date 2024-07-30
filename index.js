// server.js or index.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const Database = require('./Database'); 

const app = express();

// Middleware 
app.use(express.json());
app.use(morgan('dev'));
app.use(cors('*'));

// Route definition


// Start the server
app.listen(8000, () => {
  console.log('Listening on port 8000!');
});
