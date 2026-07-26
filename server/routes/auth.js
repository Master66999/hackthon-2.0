const express  = require('express');
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const mongoose = require('mongoose');
const User     = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'leafsense_jwt_secret_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// In-Memory User Fallback store when MongoDB Atlas connection is pending/unreachable
const inMemoryUsers = new Map();

function signToken(user) {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// ── POST /auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normEmail = email.toLowerCase().trim();

    // Check if Mongoose is connected to Atlas
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normEmail });
      if (existingUser) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      const user = await User.create({
        name: name.trim(),
        email: normEmail,
        password,
      });

      const token = signToken(user);
      return res.status(201).json({
        message: 'Registration successful!',
        token,
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      });
    } else {
      // In-Memory Fallback if Atlas is offline / bad auth
      if (inMemoryUsers.has(normEmail)) {
        return res.status(400).json({ message: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        _id: 'mem_' + Date.now(),
        name: name.trim(),
        email: normEmail,
        password: hashedPassword,
        createdAt: new Date(),
      };

      inMemoryUsers.set(normEmail, user);
      const token = signToken(user);

      return res.status(201).json({
        message: 'Registration successful!',
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    }
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({
      message: 'Registration Error: ' + err.message,
      tip: 'Please check your MongoDB Atlas password and Network Access (0.0.0.0/0).'
    });
  }
});

// ── POST /auth/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const normEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: normEmail }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      user.lastLogin = new Date();
      await user.save();

      const token = signToken(user);
      return res.json({
        message: 'Login successful!',
        token,
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
      });
    } else {
      const user = inMemoryUsers.get(normEmail);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      const token = signToken(user);
      return res.json({
        message: 'Login successful!',
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    }
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({
      message: 'Login Error: ' + err.message,
      tip: 'Please check your MongoDB Atlas password in server/.env'
    });
  }
});

// ── GET /auth/me ───────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ user });
    } else {
      const user = inMemoryUsers.get(decoded.email?.toLowerCase());
      if (user) {
        return res.json({ user: { id: user._id, name: user.name, email: user.email } });
      }
      return res.json({ user: { id: decoded.id, name: decoded.name, email: decoded.email } });
    }
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ── GET /auth/users ────────────────────────────────────────────────────────
// Admin Endpoint: List all registered users
router.get('/users', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find({}, '-password').sort({ createdAt: -1 });
      return res.json({
        source: 'MongoDB Atlas',
        count: users.length,
        users,
      });
    } else {
      const users = Array.from(inMemoryUsers.values()).map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt
      }));
      return res.json({
        source: 'Local Memory',
        count: users.length,
        users,
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

module.exports = router;
