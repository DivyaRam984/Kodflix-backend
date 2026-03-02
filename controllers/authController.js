const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SALT_ROUNDS = 10;

/**
 * POST /signup - Register a new user
 */
async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }
    console.error('Signup error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
}

/**
 * POST /signin - Authenticate user and return JWT
 */
async function signin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const [rows] = await db.execute(
      'SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error('Signin error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}

module.exports = {
  signup,
  signin,
};
