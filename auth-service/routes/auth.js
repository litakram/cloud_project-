const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [apprenant, formateur]
 *     responses:
 *       201:
 *         description: User created
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already registered
 */
// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    console.log('body received:', req.body);
    const { name, email, password, role } = req.body;
    console.log('name:', name, 'email:', email, 'password:', password);
    
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email and password are required' });

    console.log('checking existing user...');
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: 'Email already registered' });

    console.log('hashing password...');
    const hashed = await bcrypt.hash(password, 10);
    
    console.log('creating user...');
    const user = await User.create({ name, email, password: hashed, role });

    res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (err) { 
    console.error('REGISTER ERROR:', err);
    next(err); 
  }
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token issued
 *       401:
 *         description: Invalid email or password
 */
// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    const valid = user && await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, id: user._id });
  } catch (err) { next(err); }
});

module.exports = router;