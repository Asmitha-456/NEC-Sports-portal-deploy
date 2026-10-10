const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide email/register number, password, and role.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role.trim().toLowerCase();

    // Look up user
    let user = db.findOne('users', u => {
      if (u.role !== cleanRole) return false;
      const uEmail = (u.email || '').toLowerCase();
      const uReg = (u.reg || '').toLowerCase();
      return uEmail === cleanEmail || uReg === cleanEmail;
    });

    // If student didn't specify @nec.edu.in, try with domain
    if (!user && cleanRole === 'student') {
      const withDomain = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@nec.edu.in`;
      user = db.findOne('users', u => u.role === 'student' && (u.email || '').toLowerCase() === withDomain);
    }

    // Auto-provision student account if valid student role with standard password
    if (!user && cleanRole === 'student' && password === 'Student@2026') {
      const reg = cleanEmail.replace('@nec.edu.in', '').trim();
      const existingParticipant = db.findOne('participants', p => p.reg.toLowerCase() === reg.toLowerCase());
      user = {
        id: Date.now(),
        email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@nec.edu.in`,
        password: 'Student@2026',
        name: existingParticipant ? existingParticipant.name : `Student (${reg})`,
        role: 'student',
        reg: reg,
        dept: existingParticipant ? existingParticipant.dept : 'CSE',
        year: existingParticipant ? (existingParticipant.year || 'III Year') : 'III Year'
      };
      db.insert('users', user);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or user not found for selected role.' });
    }

    // Verify password (support both plain text demo passwords and bcrypt hashes)
    let isMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = user.password === password;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password. Please check your credentials.' });
    }

    // Generate JWT token (expires in 7 days)
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        dept: user.dept,
        reg: user.reg || null
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    db.logAudit(user.name, 'User Logged In', user.role, `Logged in with ${user.email}`, req.ip);

    // Sanitize user output
    const sanitizedUser = { ...user };
    delete sanitizedUser.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizedUser
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login', error: err.message });
  }
};

const googleAuth = async (req, res) => {
  try {
    const { credential, email, name, picture, role, googleId } = req.body;

    let userEmail = email;
    let userName = name;
    let userPicture = picture;
    let userSub = googleId;

    // If Google ID token credential provided, decode payload
    if (credential) {
      try {
        const decoded = jwt.decode(credential);
        if (decoded) {
          userEmail = userEmail || decoded.email;
          userName = userName || decoded.name;
          userPicture = userPicture || decoded.picture;
          userSub = userSub || decoded.sub;
        }
      } catch (e) {
        console.warn('Could not decode Google JWT credential, using direct payload fields');
      }
    }

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Google account email is required.' });
    }

    const cleanEmail = userEmail.trim().toLowerCase();

    // Look up existing user by email or googleId
    let user = db.findOne('users', u => {
      const uEmail = (u.email || '').toLowerCase();
      return uEmail === cleanEmail || (userSub && u.googleId === userSub);
    });

    if (user) {
      // Update googleId and avatar if missing
      db.update('users', u => u.id === user.id, {
        googleId: userSub || user.googleId || `google_${Date.now()}`,
        avatar: userPicture || user.avatar,
        authProvider: 'google'
      });
      user = db.findOne('users', u => u.id === user.id);
    } else {
      // Auto-provision user account
      const reg = cleanEmail.replace('@nec.edu.in', '').trim();
      const existingParticipant = db.findOne('participants', p => (p.reg && p.reg.toLowerCase() === reg.toLowerCase()) || (p.email && p.email.toLowerCase() === cleanEmail));
      
      let assignedRole = role || 'student';
      if (cleanEmail.includes('admin')) assignedRole = 'admin';
      else if (cleanEmail.includes('staff') || cleanEmail.includes('sports')) assignedRole = 'staff';

      user = {
        id: Date.now(),
        email: cleanEmail,
        googleId: userSub || `google_${Date.now()}`,
        password: 'GoogleOAuthUser',
        name: userName || (existingParticipant ? existingParticipant.name : `Google User (${reg})`),
        role: assignedRole,
        reg: /^\d+$/.test(reg) ? reg : (existingParticipant ? existingParticipant.reg : null),
        dept: existingParticipant ? existingParticipant.dept : 'CSE',
        year: existingParticipant ? existingParticipant.year : 'III Year',
        avatar: userPicture || null,
        authProvider: 'google'
      };
      db.insert('users', user);
    }

    // Sign JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        dept: user.dept,
        reg: user.reg || null
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    db.logAudit(user.name, 'Google OAuth Login', user.role, `Logged in via Google (${user.email})`, req.ip);

    const sanitizedUser = { ...user };
    delete sanitizedUser.password;

    res.json({
      success: true,
      message: 'Google Sign-In successful',
      token,
      user: sanitizedUser
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ success: false, message: 'Google authentication failed', error: err.message });
  }
};

const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  const user = { ...req.user };
  delete user.password;
  res.json({ success: true, user });
};

module.exports = {
  login,
  googleAuth,
  getMe
};
