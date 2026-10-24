const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { verifyPassword } = require('../utils/password');

const  login =async(req, res)=>{
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is missing');
    }
    const token = jwt.sign(
      { sub: String(user.id), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ error: 'Could not log in' });
  }
}
module.exports={login};