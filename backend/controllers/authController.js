const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
    algorithm: 'HS256'
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide an email and password' });
    }

    const user = await User.findOne({ email });

    // Check user & passwords match
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Login/Register with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Decode Google token (In production, use google-auth-library to verify!)
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const { name, email, picture, sub } = decoded;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if they don't exist
      // We generate a random password since it's required by the model
      const randomPassword = Math.random().toString(36).slice(-10) + sub.slice(-5);
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        picture: picture // We might want to add this to the model later
      });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      picture: picture || user.picture,
      token: generateToken(user._id) // Return LOCAL token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  googleLogin
};
