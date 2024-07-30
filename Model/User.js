const bcrypt = require('bcrypt');
const Database = require('../Database');
const jwt = require('jsonwebtoken');

// Function to generate a random phone number
const generateRandomPhoneNumber = () => {
  const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;
  return randomNumber.toString();
};

// Create a new user
const createUser = async (userData) => {
  const { username, email, password, address, gender } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  const phoneNumber = generateRandomPhoneNumber();

  const query = 'INSERT INTO users (username, email, password, phoneNumber, address, gender) VALUES (?, ?, ?, ?, ?, ?)';
  const values = [username, email, hashedPassword, phoneNumber, address, gender];

  return new Promise((resolve, reject) => {
    Database.query(query, values, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results.insertId);
    });
  });
};

// Get all users
const getAllUsers = () => {
  const query = 'SELECT * FROM users';

  return new Promise((resolve, reject) => {
    Database.query(query, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

// Delete a user by ID
const deleteUserById = (userId) => {
  const query = 'DELETE FROM users WHERE id = ?';

  return new Promise((resolve, reject) => {
    Database.query(query, [userId], (error, results) => {
      if (error) {
        return reject(error);
      }
      if (results.affectedRows === 0) {
        return reject(new Error(`User with id ${userId} not found`));
      }
      resolve(results);
    });
  });
};

// Verify if a user exists for login
const verifyUserExists = async (email, password) => {
  const query = 'SELECT * FROM users WHERE email = ?';

  return new Promise((resolve, reject) => {
    Database.query(query, [email], async (error, results) => {
      if (error) {
        return reject(error);
      }

      if (results.length === 0) {
        return reject(new Error('User not found'));
      }

      const user = results[0];

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return reject(new Error('Invalid password'));
      }

      // Generate JWT
      const token = jwt.sign({ id: user.id, email: user.email }, 'your_jwt_secret', { expiresIn: '1h' });

      resolve({ user, token });
    });
  });
};

// Update user password
const updateUserPassword = async (userId, username, email, password, newPassword) => {
  const query = 'SELECT * FROM users WHERE id = ?';

  return new Promise((resolve, reject) => {
    Database.query(query, [userId], async (error, results) => {
      if (error) {
        return reject(error);
      }

      if (results.length === 0) {
        return reject(new Error('User not found'));
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return reject(new Error('The email or the password is incorrect'));
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const updateQuery = 'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?';
      const updateValues = [username, email, hashedNewPassword, userId];

      Database.query(updateQuery, updateValues, (updateError, updateResults) => {
        if (updateError) {
          return reject(updateError);
        }
        resolve({ id: userId, username, email });
      });
    });
  });
};

module.exports = {
  createUser,
  getAllUsers,
  deleteUserById,
  verifyUserExists,
  updateUserPassword,
};
