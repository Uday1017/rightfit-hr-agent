import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const sign = (user) => jwt.sign(
  { id: user._id, username: user.username },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    res.status(201).json({ token: sign(user), user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ error: `${field === 'email' ? 'Email' : 'Username'} already in use` });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ token: sign(user), user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function saveApiKey(req, res, next) {
  try {
    const { geminiApiKey } = req.body;
    await User.updateOne({ _id: req.user.id }, { geminiApiKey: geminiApiKey || null });
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function getApiKey(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('geminiApiKey');
    const key = user?.geminiApiKey || '';
    // Mask all but last 4 chars
    const masked = key.length > 4 ? '•'.repeat(key.length - 4) + key.slice(-4) : key;
    res.json({ hasKey: !!key, maskedKey: masked });
  } catch (err) { next(err); }
}
