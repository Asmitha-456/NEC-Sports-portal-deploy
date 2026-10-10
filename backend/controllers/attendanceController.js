const db = require('../database/db');

// Get attendance for an event
const getAttendanceByEvent = (req, res) => {
  try {
    const { event } = req.query;
    if (!event) {
      return res.status(400).json({ success: false, message: 'Event name is required.' });
    }

    const participants = db.find('participants', p => p.event.toLowerCase() === event.toLowerCase());
    const attendanceRecords = db.find('attendance', a => a.event.toLowerCase() === event.toLowerCase());

    const enriched = participants.map(p => {
      const key = `${event}|${p.reg}`;
      const rec = attendanceRecords.find(a => a.key === key);
      return {
        reg: p.reg,
        name: p.name,
        dept: p.dept,
        gender: p.gender,
        year: p.year || 'III Year',
        present: rec ? rec.present : false,
        markedAt: rec ? rec.date : null
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve attendance', error: err.message });
  }
};

// Save attendance records
const saveAttendance = (req, res) => {
  try {
    const { event, records } = req.body;

    if (!event || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Event name and attendance records array are required.' });
    }

    const now = new Date().toLocaleString();
    let presentCount = 0;

    records.forEach(r => {
      const key = `${event}|${r.reg}`;
      const existing = db.findOne('attendance', a => a.key === key);
      const isPresent = Boolean(r.present);
      if (isPresent) presentCount++;

      if (existing) {
        db.update('attendance', a => a.key === key, {
          present: isPresent,
          date: now,
          markedBy: req.user?.name || 'PT Staff'
        });
      } else {
        db.insert('attendance', {
          id: Date.now() + Math.floor(Math.random() * 1000),
          key,
          event,
          reg: r.reg,
          name: r.name,
          dept: r.dept,
          present: isPresent,
          date: now,
          markedBy: req.user?.name || 'PT Staff'
        });
      }
    });

    db.logAudit(
      req.user?.name,
      'Saved Attendance',
      event,
      `Marked ${records.length} students (${presentCount} present, ${records.length - presentCount} absent)`
    );

    res.json({
      success: true,
      message: `Attendance recorded: ${presentCount} present out of ${records.length} students.`,
      presentCount,
      totalCount: records.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save attendance', error: err.message });
  }
};

module.exports = {
  getAttendanceByEvent,
  saveAttendance
};
