const db = require('../database/db');

// Get all participants with filters
const getParticipants = (req, res) => {
  try {
    const { event, dept, status, search, reg, name, email } = req.query;
    let participants = db.get('participants');

    if (reg) {
      participants = participants.filter(p => (p.reg || '').toLowerCase() === reg.trim().toLowerCase());
    }

    if (name) {
      const qName = name.trim().toLowerCase();
      participants = participants.filter(p => {
        const pName = (p.name || '').toLowerCase();
        return pName === qName || pName.includes(qName) || qName.includes(pName);
      });
    }

    if (email) {
      participants = participants.filter(p => (p.email || '').toLowerCase() === email.trim().toLowerCase());
    }

    if (event && event !== 'All') {
      participants = participants.filter(p => (p.event || '').toLowerCase() === event.toLowerCase());
    }

    if (dept && dept !== 'All') {
      participants = participants.filter(p => (p.dept || '').toUpperCase() === dept.toUpperCase());
    }

    if (status && status !== 'All') {
      participants = participants.filter(p => (p.status || '').toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      participants = participants.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.reg || '').toLowerCase().includes(q) ||
        (p.event || '').toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: participants.length, data: participants });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve participants', error: err.message });
  }
};

// Get current student's registrations (multi-criteria matching by reg, name, email, userId)
const getMyRegistrations = (req, res) => {
  try {
    const user = req.user;
    const { reg, name, email } = req.query;

    const targetReg = (user?.reg || reg || '').trim().toLowerCase();
    const targetName = (user?.name || name || '').trim().toLowerCase();
    const targetEmail = (user?.email || email || '').trim().toLowerCase();
    const targetUserId = user?.id;

    if (!targetReg && !targetName && !targetEmail && !targetUserId) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const participants = db.get('participants') || [];

    const myRegistrations = participants.filter(p => {
      // 1. Direct user ID match
      if (targetUserId && p.userId && p.userId === targetUserId) return true;
      // 2. Email match
      if (targetEmail && p.email && p.email.toLowerCase() === targetEmail) return true;
      // 3. Register number match
      if (targetReg && p.reg && p.reg.toLowerCase() === targetReg) return true;
      // 4. Exact or clean name match
      if (targetName && p.name) {
        const pName = p.name.trim().toLowerCase();
        if (pName === targetName) return true;
        // Clean matching: e.g. "Asmitha S" matches "Asmitha" or "Asmi"
        if (pName.length >= 3 && targetName.length >= 3) {
          if (pName.startsWith(targetName) || targetName.startsWith(pName)) return true;
        }
      }
      return false;
    });

    res.json({ success: true, count: myRegistrations.length, data: myRegistrations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve your registrations', error: err.message });
  }
};

// Register a participant
const registerParticipant = (req, res) => {
  try {
    const { reg, name, dept, event, gender, year } = req.body;

    if (!reg || !name || !dept || !event) {
      return res.status(400).json({ success: false, message: 'Register number, name, department, and event are required.' });
    }

    // Verify event exists (support exact match or partial match like "Badminton (24 Sept 2026)")
    const cleanEventName = event.trim().toLowerCase();
    const eventObj = db.findOne('events', e => {
      const dbName = (e.name || '').toLowerCase();
      return dbName === cleanEventName || cleanEventName.startsWith(dbName) || dbName.startsWith(cleanEventName);
    });
    if (!eventObj) {
      return res.status(404).json({ success: false, message: `Selected event '${event}' does not exist.` });
    }

    // Check limit
    const currentMembers = db.find('participants', p => (p.event || '').toLowerCase() === eventObj.name.toLowerCase());
    if (currentMembers.length >= (eventObj.limit || 50)) {
      return res.status(400).json({ success: false, message: 'Registration full for this event.' });
    }

    // Check duplicate registration
    const existing = db.findOne('participants', p =>
      (p.event || '').toLowerCase() === eventObj.name.toLowerCase() &&
      (
        (p.reg || '').toLowerCase() === reg.trim().toLowerCase() ||
        (p.name && req.user?.name && p.name.toLowerCase() === req.user.name.toLowerCase())
      )
    );
    if (existing) {
      return res.status(400).json({ success: false, message: `Student is already registered for ${eventObj.name}.` });
    }

    const newParticipant = {
      id: Date.now() + Math.floor(Math.random() * 100),
      reg: reg.trim(),
      name: name.trim(),
      dept: dept.trim().toUpperCase(),
      event: eventObj.name,
      gender: gender || 'Male',
      status: 'Selected',
      year: year || 'III Year',
      userId: req.user ? req.user.id : null,
      email: req.user ? req.user.email : null,
      registeredAt: new Date().toISOString()
    };

    db.insert('participants', newParticipant);

    // Auto-link register number to user account if missing
    if (req.user && req.user.id) {
      const userRecord = db.findOne('users', u => u.id === req.user.id);
      if (userRecord && (!userRecord.reg || userRecord.reg === 'null')) {
        db.update('users', u => u.id === req.user.id, {
          reg: newParticipant.reg,
          dept: newParticipant.dept || userRecord.dept
        });
      }
    }

    db.logAudit(req.user?.name || name, 'Registered Participant', eventObj.name, `Reg No: ${newParticipant.reg}, Dept: ${newParticipant.dept}`);
    db.notify(
      'Event Registration Confirmed',
      `You are successfully registered for ${eventObj.name} (${eventObj.venue}, ${eventObj.date}). Status: Selected.`,
      'general',
      'student',
      newParticipant.reg
    );

    res.status(201).json({
      success: true,
      message: `Registration successful for ${eventObj.name}!`,
      data: newParticipant,
      updatedReg: newParticipant.reg
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to register participant', error: err.message });
  }
};

// Update participant status
const updateStatus = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const updated = db.update('participants', p => p.id === id, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Participant not found.' });
    }

    db.logAudit(req.user?.name, 'Updated Participant Status', updated.name, `Event: ${updated.event}, New Status: ${status}`);

    res.json({ success: true, message: 'Status updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
  }
};

// Deregister / cancel participant registration
const deleteParticipant = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = db.findOne('participants', p => p.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Participant registration not found.' });
    }

    // Check authorization: admin, staff, or student deregistering themselves
    if (req.user && req.user.role === 'student' && req.user.reg && req.user.reg.toLowerCase() !== existing.reg.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this registration.' });
    }

    db.delete('participants', p => p.id === id);
    db.logAudit(req.user?.name || existing.name, 'Cancelled Event Registration', existing.event, `Reg: ${existing.reg}`);

    res.json({ success: true, message: `Registration cancelled for ${existing.event}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to cancel registration', error: err.message });
  }
};

module.exports = {
  getParticipants,
  getMyRegistrations,
  registerParticipant,
  updateStatus,
  deleteParticipant
};
