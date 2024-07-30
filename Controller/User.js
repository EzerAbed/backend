// controllers/UserController.js
const bcrypt = require('bcrypt');
const db = require('../db');
const userValidation = require('../Validation/User');
const jwt = require('jsonwebtoken');

// Function to generate a random phone number
const generateRandomPhoneNumber = () => {
  const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
  return randomNumber.toString();
};

// Create a new user
const createNewUser = async (req, res) => {
  let { error, value } = userValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { username, email, password, address, gender } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const phoneNumber = generateRandomPhoneNumber();

  const query = 'INSERT INTO users (username, email, password, phoneNumber, address, gender) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [username, email, hashedPassword, phoneNumber, address, gender];

  db.query(query, values, (err, results) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        if (err.sqlMessage.includes('username')) {
          return res.status(400).json({ message: 'The Username Already exists!' });
        } else if (err.sqlMessage.includes('email')) {
          return res.status(400).json({ message: 'This Email has already been used!' });
        }
      }
      return res.status(500).json({ message: err.message });
    }
    res.status(201).json({ id: results.insertId });
  });
};

// Get all users
const getAllUsers = (req, res) => {
  const query = 'SELECT * FROM users';

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Unexpected Server Error' });
    }
    res.status(200).json(results);
  });
};

// Delete user by id
const deleteUserById = (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM users WHERE id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: `User with id ${userId} not found` });
    }
    res.json({ message: 'User deleted successfully' });
  });
};

// Verify if a user exists for login
const verifyUserExists = (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM users WHERE email = ?';

  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'The email or the password is incorrect' });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'The email or the password is incorrect' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        profileImage: user.profileImage,
        phoneNumber: user.phoneNumber,
        address: user.address,
        facebook: user.facebook,
        twitter: user.twitter,
        instagram: user.instagram,
      },
      token,
    });
  });
};

// Update user password
const updateUserPassword = (req, res) => {
  const { id, username, email, password, newPassword } = req.body;
  const selectQuery = 'SELECT * FROM users WHERE id = ?';

  db.query(selectQuery, [id], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'The email or the password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updateQuery = 'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?';
    const updateValues = [username, email, hashedNewPassword, id];

    db.query(updateQuery, updateValues, (updateErr, updateResults) => {
      if (updateErr) {
        return res.status(500).json({ message: updateErr.message });
      }
      res.json({ id, username, email });
    });
  });
};

module.exports = {
  createNewUser,
  getAllUsers,
  deleteUserById,
  verifyUserExists,
  updateUserPassword,
};
