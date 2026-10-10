const db = require('../database/db');

// Get department leaderboard
const getDepartmentPoints = (req, res) => {
  try {
    const pointsObj = db.get('points');
    const sorted = Object.entries(pointsObj)
      .map(([dept, points]) => ({ dept, points }))
      .sort((a, b) => b.points - a.points);

    const totalPoints = sorted.reduce((sum, item) => sum + item.points, 0);

    res.json({
      success: true,
      totalPoints,
      departmentsCount: sorted.length,
      data: sorted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve department points', error: err.message });
  }
};

// Get student leaderboard
const getStudentPoints = (req, res) => {
  try {
    const studentPointsObj = db.get('studentPoints');
    const participants = db.get('participants');

    const leaderboard = Object.entries(studentPointsObj)
      .map(([reg, points]) => {
        const student = participants.find(p => p.reg === reg);
        return {
          reg,
          points,
          name: student ? student.name : reg,
          dept: student ? student.dept : 'General',
          year: student ? student.year : 'III Year'
        };
      })
      .sort((a, b) => b.points - a.points);

    res.json({ success: true, count: leaderboard.length, data: leaderboard });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve student points', error: err.message });
  }
};

// Award or update points
const updatePoints = (req, res) => {
  try {
    const { dept, reg, points, reason } = req.body;

    if (!points || isNaN(points)) {
      return res.status(400).json({ success: false, message: 'Valid points number is required.' });
    }

    const addedPoints = parseInt(points);

    // Update department points if provided
    if (dept) {
      const cleanDept = dept.toUpperCase();
      const currentDeptPoints = db.get('points');
      currentDeptPoints[cleanDept] = (currentDeptPoints[cleanDept] || 0) + addedPoints;
      db.set('points', currentDeptPoints);
    }

    // Update student points if provided
    if (reg) {
      const currentStudentPoints = db.get('studentPoints');
      currentStudentPoints[reg] = (currentStudentPoints[reg] || 0) + addedPoints;
      db.set('studentPoints', currentStudentPoints);
    }

    db.logAudit(
      req.user?.name,
      'Awarded Sports Points',
      dept || reg,
      `+${addedPoints} pts: ${reason || 'Tournament victory'}`
    );

    res.json({
      success: true,
      message: `Points updated successfully (+${addedPoints} points).`,
      deptPoints: db.get('points'),
      studentPoints: db.get('studentPoints')
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update points', error: err.message });
  }
};

module.exports = {
  getDepartmentPoints,
  getStudentPoints,
  updatePoints
};
