const bcrypt = require('bcryptjs');
const db = require('../database/db');

// Get all users (Admin only)
const getUsers = (req, res) => {
  try {
    const users = db.get('users').map(u => {
      const sanitized = { ...u };
      delete sanitized.password;
      return sanitized;
    });

    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve users', error: err.message });
  }
};

// Create new user (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, dept, reg, year } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findOne('users', u => (u.email || '').toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let effectiveReg = reg ? reg.trim() : undefined;
    if (!effectiveReg && role.trim().toLowerCase() === 'student') {
      const matchDigits = cleanEmail.match(/\d+/);
      if (matchDigits) effectiveReg = matchDigits[0];
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role.trim().toLowerCase(),
      dept: dept ? dept.trim() : 'General',
      reg: effectiveReg || undefined,
      year: year ? year.trim() : 'III Year',
      createdAt: new Date().toISOString()
    };

    db.insert('users', newUser);
    db.logAudit(req.user?.name, 'Created User', newUser.email, `Role: ${newUser.role}`);

    const sanitized = { ...newUser };
    delete sanitized.password;

    res.status(201).json({ success: true, message: 'User created successfully', data: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create user', error: err.message });
  }
};

module.exports = {
  getUsers,
  createUser
};
