const db = require('../database/db');

// Convert array of objects to CSV string
const toCSV = (headers, rows) => {
  const headerLine = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map(row =>
    row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
  );
  return [headerLine, ...rowLines].join('\r\n');
};

// Get audit logs
const getAuditTrail = (req, res) => {
  try {
    const audit = db.get('audit');
    res.json({ success: true, count: audit.length, data: audit });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit trail', error: err.message });
  }
};

// Export all members CSV
const exportMembersCSV = (req, res) => {
  try {
    const participants = db.get('participants');
    const headers = ['Register No', 'Student Name', 'Department', 'Event', 'Gender', 'Status', 'Year'];
    const rows = participants.map(p => [p.reg, p.name, p.dept, p.event, p.gender, p.status, p.year || 'III Year']);

    const csvData = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="NEC_Sports_All_Members.csv"');
    res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export members CSV', error: err.message });
  }
};

// Export attendance CSV
const exportAttendanceCSV = (req, res) => {
  try {
    const attendance = db.get('attendance');
    const headers = ['Event', 'Register No', 'Name', 'Department', 'Attendance Status', 'Date Marked', 'Marked By'];
    const rows = attendance.map(a => [
      a.event,
      a.reg,
      a.name || '',
      a.dept || '',
      a.present ? 'Present' : 'Absent',
      a.date || '',
      a.markedBy || 'PT Staff'
    ]);

    const csvData = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="NEC_Sports_Attendance_Report.csv"');
    res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export attendance CSV', error: err.message });
  }
};

// Export department points CSV
const exportPointsCSV = (req, res) => {
  try {
    const pointsObj = db.get('points');
    const headers = ['Department', 'Points'];
    const rows = Object.entries(pointsObj)
      .sort((a, b) => b[1] - a[1])
      .map(([dept, pts]) => [dept, pts]);

    const csvData = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="NEC_Department_Points.csv"');
    res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export points CSV', error: err.message });
  }
};

// Export audit CSV
const exportAuditCSV = (req, res) => {
  try {
    const audit = db.get('audit');
    const headers = ['Actor', 'Action', 'Target', 'Detail', 'Date', 'IP Address'];
    const rows = audit.map(a => [a.actor, a.action, a.target, a.detail, a.date, a.ip || '']);

    const csvData = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="NEC_Audit_Trail.csv"');
    res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export audit CSV', error: err.message });
  }
};

// Export specific OD Batch CSV
const exportODBatchCSV = (req, res) => {
  try {
    const batchId = parseInt(req.params.batchId);
    const batch = db.findOne('odBatches', b => b.id === batchId);

    if (!batch) {
      return res.status(404).json({ success: false, message: 'OD Batch not found.' });
    }

    const headers = ['S.No', 'Register No', 'Student Name', 'Department', 'Year', 'Event', 'Venue', 'Date', 'Session', 'OD Status', 'Ref No'];
    const rows = (batch.students || []).map((s, idx) => [
      idx + 1,
      s.reg,
      s.name,
      s.dept,
      s.year || 'III Year',
      batch.eventName,
      batch.venue,
      batch.eventDate,
      batch.session,
      s.odStatus || batch.status,
      batch.refNo
    ]);

    const filename = `NEC_OD_${batch.refNo.replace(/[^A-Za-z0-9_-]/g, '_')}.csv`;
    const csvData = toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to export OD batch CSV', error: err.message });
  }
};

module.exports = {
  getAuditTrail,
  exportMembersCSV,
  exportAttendanceCSV,
  exportPointsCSV,
  exportAuditCSV,
  exportODBatchCSV
};
