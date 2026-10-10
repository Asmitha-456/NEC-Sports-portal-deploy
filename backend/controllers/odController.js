const db = require('../database/db');

// Helper to format academic year
const getAcademicYear = () => process.env.ACADEMIC_YEAR || '2026-27';

// Helper to generate official reference number
const generateRefNo = (dept = 'ALL', eventName = 'SPT') => {
  const year = getAcademicYear();
  const cleanDept = dept.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5) || 'GEN';
  const cleanEvent = eventName.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4);
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  return `NEC/PED/OD/${year}/${cleanDept}-${cleanEvent}/${randomSeq}`;
};

/**
 * AUTOMATIC OD LIST GENERATOR
 * Generates official OD requisition lists based on automated criteria:
 * - Selected or attended participants
 * - Event date and session
 * - Department filtering or automatic department-wise split
 */
const autoGenerateOD = (req, res) => {
  try {
    const {
      eventId,
      department = 'All',
      session = 'Full Day',
      minStatus = 'Selected',
      requireAttendancePresent = false,
      splitByDepartment = false,
      remarks = ''
    } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Please select an event to generate OD.' });
    }

    const event = db.findOne('events', e => e.id === parseInt(eventId));
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Retrieve participants for this event
    let participants = db.find('participants', p => p.event.toLowerCase() === event.name.toLowerCase());

    // Filter by participant status
    if (minStatus && minStatus !== 'All') {
      participants = participants.filter(p => p.status.toLowerCase() === minStatus.toLowerCase());
    }

    // Filter by department if specified
    if (department && department !== 'All') {
      participants = participants.filter(p => p.dept.toUpperCase() === department.toUpperCase());
    }

    // Optional check: verify student was marked present in attendance
    if (requireAttendancePresent) {
      const attendanceRecords = db.find('attendance', a => a.event.toLowerCase() === event.name.toLowerCase() && a.present === true);
      const presentRegs = new Set(attendanceRecords.map(a => a.reg.toLowerCase()));
      participants = participants.filter(p => presentRegs.has(p.reg.toLowerCase()));
    }

    if (!participants.length) {
      return res.status(400).json({
        success: false,
        message: `No eligible students found for event '${event.name}' with status '${minStatus}'${department !== 'All' ? ` in ${department}` : ''}.`
      });
    }

    // Helper to construct a single batch
    const createBatch = (deptName, studentList) => {
      const breakdown = {};
      studentList.forEach(s => {
        breakdown[s.dept] = (breakdown[s.dept] || 0) + 1;
      });

      const refNo = generateRefNo(deptName, event.name);
      const batchId = Date.now() + Math.floor(Math.random() * 1000);

      const batch = {
        id: batchId,
        refNo,
        title: `Automatic OD Requisition — ${event.name} (${deptName})`,
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time || '09:00 AM',
        venue: event.venue,
        session,
        department: deptName,
        totalStudents: studentList.length,
        departmentBreakdown: breakdown,
        status: 'Generated',
        generatedAt: new Date().toISOString(),
        generatedBy: req.user?.name || 'PT Staff Coordinator',
        remarks: remarks || `Auto-generated OD for ${studentList.length} participants in ${event.name}`,
        students: studentList.map(s => ({
          reg: s.reg,
          name: s.name,
          dept: s.dept,
          year: s.year || 'III Year',
          gender: s.gender,
          event: event.name,
          status: s.status,
          odStatus: 'Approved'
        })),
        approvalHistory: [
          {
            status: 'Generated',
            changedBy: req.user?.name || 'System Automation',
            timestamp: new Date().toISOString(),
            comments: `Automatically generated based on ${minStatus} roster`
          }
        ]
      };

      db.insert('odBatches', batch);

      // Send personal notification to each student
      studentList.forEach(s => {
        db.notify(
          'On-Duty (OD) Pass Generated',
          `Your OD requisition for ${event.name} on ${event.date} (${session}) has been generated. Ref: ${refNo}`,
          'od',
          'student',
          s.reg,
          { batchId, refNo, eventName: event.name, eventDate: event.date, session }
        );
      });

      // Send notification to staff and HOD
      db.notify(
        `📋 OD Requisition: ${event.name} (${deptName})`,
        `OD list generated for ${studentList.length} student(s) in ${event.name}. Ref: ${refNo}. Forwarded for HOD clearance.`,
        'od',
        'staff',
        null,
        { batchId, refNo, eventName: event.name, count: studentList.length, dept: deptName }
      );

      return batch;
    };

    const createdBatches = [];

    if (splitByDepartment && department === 'All') {
      // Group participants by department
      const deptGroups = {};
      participants.forEach(p => {
        if (!deptGroups[p.dept]) deptGroups[p.dept] = [];
        deptGroups[p.dept].push(p);
      });

      for (const [dept, list] of Object.entries(deptGroups)) {
        createdBatches.push(createBatch(dept, list));
      }
    } else {
      createdBatches.push(createBatch(department, participants));
    }

    db.logAudit(
      req.user?.name,
      'Auto-Generated OD List',
      event.name,
      `Generated ${createdBatches.length} batch(es) for ${participants.length} students`
    );

    res.status(201).json({
      success: true,
      message: `Successfully generated ${createdBatches.length} OD batch(es) for ${participants.length} student(s).`,
      count: createdBatches.length,
      data: splitByDepartment && department === 'All' ? createdBatches : createdBatches[0]
    });
  } catch (err) {
    console.error('Error auto-generating OD:', err);
    res.status(500).json({ success: false, message: 'Failed to generate OD list', error: err.message });
  }
};

// Get all OD batches with filters
const getODBatches = (req, res) => {
  try {
    const { status, department, eventId, search } = req.query;
    let batches = db.get('odBatches');

    if (status && status !== 'All') {
      batches = batches.filter(b => b.status.toLowerCase() === status.toLowerCase());
    }

    if (department && department !== 'All') {
      batches = batches.filter(b => b.department === department || b.department === 'All');
    }

    if (eventId) {
      batches = batches.filter(b => b.eventId === parseInt(eventId));
    }

    if (search) {
      const q = search.toLowerCase();
      batches = batches.filter(b =>
        b.refNo.toLowerCase().includes(q) ||
        b.eventName.toLowerCase().includes(q) ||
        b.venue.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    batches.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    res.json({ success: true, count: batches.length, data: batches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch OD batches', error: err.message });
  }
};

// Get single OD batch by ID
const getODBatchById = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const batch = db.findOne('odBatches', b => b.id === id);

    if (!batch) {
      return res.status(404).json({ success: false, message: 'OD batch not found.' });
    }

    res.json({ success: true, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve OD batch', error: err.message });
  }
};

// Update OD batch status (Workflow Approval: Generated -> Submitted -> HOD Approved -> Principal Sanctioned)
const updateODStatus = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, comments } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const batch = db.findOne('odBatches', b => b.id === id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'OD batch not found.' });
    }

    const historyEntry = {
      status,
      changedBy: req.user?.name || 'Administrator',
      timestamp: new Date().toISOString(),
      comments: comments || `Status updated to ${status}`
    };

    const approvalHistory = [...(batch.approvalHistory || []), historyEntry];

    const updated = db.update('odBatches', b => b.id === id, {
      status,
      approvalHistory
    });

    // Notify students on approval
    if (status.includes('Approved') || status.includes('Sanctioned')) {
      batch.students.forEach(s => {
        db.notify(
          'OD Sanction Approved',
          `Your OD for ${batch.eventName} on ${batch.eventDate} has been officially approved!`,
          'od',
          'student',
          s.reg
        );
      });
    }

    db.logAudit(req.user?.name, 'Updated OD Batch Status', batch.refNo, `New status: ${status}`);

    res.json({ success: true, message: `OD batch updated to ${status}`, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update OD status', error: err.message });
  }
};

// Student Self-Service: Get personal OD records
const getStudentOD = (req, res) => {
  try {
    const reg = (req.params.reg || req.query.reg || req.user?.reg || '').trim().toLowerCase();
    const name = (req.query.name || req.user?.name || '').trim().toLowerCase();

    if (!reg && !name) {
      return res.status(400).json({ success: false, message: 'Student Register Number or Name is required.' });
    }

    const batches = db.get('odBatches') || [];
    const studentODs = [];

    batches.forEach(b => {
      const match = (b.students || []).find(s => {
        if (reg && reg !== 'null' && s.reg && s.reg.toLowerCase() === reg) return true;
        if (name && s.name) {
          const sName = s.name.trim().toLowerCase();
          if (sName === name || sName.includes(name) || name.includes(sName)) return true;
        }
        return false;
      });

      if (match) {
        studentODs.push({
          batchId: b.id,
          refNo: b.refNo,
          eventName: b.eventName,
          eventDate: b.eventDate,
          venue: b.venue,
          session: b.session,
          batchStatus: b.status,
          odStatus: match.odStatus || b.status,
          studentName: match.name,
          studentDept: match.dept,
          studentYear: match.year,
          generatedAt: b.generatedAt
        });
      }
    });

    res.json({ success: true, count: studentODs.length, data: studentODs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve student OD records', error: err.message });
  }
};

// Delete OD Batch
const deleteODBatch = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = db.findOne('odBatches', b => b.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'OD batch not found.' });
    }

    db.delete('odBatches', b => b.id === id);
    db.logAudit(req.user?.name, 'Deleted OD Batch', existing.refNo, `Deleted batch ID ${id}`);

    res.json({ success: true, message: 'OD batch deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete OD batch', error: err.message });
  }
};

// Department-wise OD Analytics
const getODAnalytics = (req, res) => {
  try {
    const batches = db.get('odBatches');
    const deptCounts = {};
    let totalStudentODs = 0;

    batches.forEach(b => {
      (b.students || []).forEach(s => {
        deptCounts[s.dept] = (deptCounts[s.dept] || 0) + 1;
        totalStudentODs++;
      });
    });

    res.json({
      success: true,
      data: {
        totalBatches: batches.length,
        totalStudentODs,
        departmentBreakdown: deptCounts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve OD analytics', error: err.message });
  }
};

// Generate and retrieve official HOD WhatsApp dispatch text
const getHODWhatsAppOD = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const batch = db.findOne('odBatches', b => b.id === id);
    if (!batch) {
      return res.status(404).json({ success: false, message: 'OD batch not found.' });
    }

    const studentsFormatted = (batch.students || []).map((s, idx) =>
      `${idx + 1}. *${s.name}* (${s.reg}) - ${s.dept} (${s.year || 'III Year'})`
    ).join('\n');

    const whatsappText = `🏛️ *NATIONAL ENGINEERING COLLEGE (AUTONOMOUS)*\n` +
      `*DEPARTMENT OF PHYSICAL EDUCATION & SPORTS*\n` +
      `-----------------------------------------\n` +
      `📋 *OFFICIAL ON-DUTY (OD) REQUISITION FOR HOD SANCTION*\n\n` +
      `Respected Head of the Department,\n` +
      `Department of *${batch.department === 'All' ? 'Concerned Departments' : batch.department}*,\n\n` +
      `The following bonafide student(s) are officially representing our college in the upcoming sports championship:\n\n` +
      `🏆 *Event:* ${batch.eventName}\n` +
      `📅 *Date:* ${batch.eventDate}\n` +
      `⏰ *Session:* ${batch.session || 'Full Day'}\n` +
      `📍 *Venue:* ${batch.venue}\n` +
      `📄 *Ref No:* ${batch.refNo}\n` +
      `⚡ *Status:* ${batch.status}\n\n` +
      `👥 *PARTICIPATING STUDENT ROSTER (${batch.students ? batch.students.length : 0} Students):*\n` +
      `${studentsFormatted}\n\n` +
      `Kindly grant official On-Duty (OD) attendance permission for the above student(s) for the specified tournament session.\n\n` +
      `Warm regards,\n` +
      `*Dr. K. Murugan*, Physical Director\n` +
      `National Engineering College, Kovilpatti\n` +
      `-----------------------------------------`;

    res.json({
      success: true,
      batchId: batch.id,
      refNo: batch.refNo,
      department: batch.department,
      studentCount: batch.students ? batch.students.length : 0,
      whatsappText
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate HOD WhatsApp message', error: err.message });
  }
};

const mailer = require('../utils/mailer');

// Dispatch OD letter via email to selected students / departments
const emailDispatchOD = async (req, res) => {
  try {
    const {
      batchId,
      eventId,
      eventName,
      department = 'All',
      students = [],
      customRecipients = '',
      subject = '',
      customRemarks = '',
      session = 'Full Day'
    } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      if (!customRecipients) {
        return res.status(400).json({ success: false, message: 'Please select at least one student or specify custom recipient emails.' });
      }
    }

    // Resolve event details
    let resolvedEvent = null;
    if (eventId) {
      resolvedEvent = db.findOne('events', e => e.id === parseInt(eventId));
    }
    if (!resolvedEvent && eventName) {
      resolvedEvent = db.findOne('events', e => (e.name || '').toLowerCase() === eventName.toLowerCase());
    }

    // Resolve batch details if linked to an existing batch
    let batch = null;
    if (batchId) {
      batch = db.findOne('odBatches', b => b.id === parseInt(batchId));
    }

    const evName = resolvedEvent ? resolvedEvent.name : (batch ? batch.eventName : (eventName || 'Sports Championship'));
    const evDate = resolvedEvent ? resolvedEvent.date : (batch ? batch.eventDate : new Date().toISOString().split('T')[0]);
    const evTime = resolvedEvent ? (resolvedEvent.time || '09:00 AM') : (batch ? (batch.eventTime || '09:00 AM') : '09:00 AM');
    const evVenue = resolvedEvent ? resolvedEvent.venue : (batch ? batch.venue : 'College Ground');
    const evSession = session || (batch ? batch.session : 'Full Day');
    const refNo = batch ? batch.refNo : generateRefNo(department, evName);

    const eventDetails = {
      eventName: evName,
      eventDate: evDate,
      eventTime: evTime,
      venue: evVenue,
      session: evSession,
      refNo,
      academicYear: getAcademicYear()
    };

    const dispatchResults = [];
    const sentEmails = [];

    // Dispatch to each selected student
    for (const student of students) {
      const email = student.email || `${student.reg}@nec.edu.in`;
      try {
        const result = await mailer.sendODEmail({
          student,
          recipientEmail: email,
          eventDetails,
          customSubject: subject || `🏛️ Official NEC Sports OD Sanction Letter — ${evName}`,
          customRemarks
        });
        dispatchResults.push(result);
        sentEmails.push(email);

        // Record in student notifications
        db.insert('notifications', {
          id: Date.now() + Math.floor(Math.random() * 1000),
          title: `📨 Official OD Letter Emailed: ${evName}`,
          body: `Your official sports On-Duty (OD) sanction order for ${evName} (${evDate}, ${evSession}) has been dispatched to ${email}.`,
          date: new Date().toLocaleString(),
          type: 'od',
          targetReg: student.reg,
          read: false
        });
      } catch (err) {
        console.error(`Failed to send email to ${email}:`, err.message);
      }
    }

    // Dispatch to custom recipients (HOD, Tutor, etc.)
    if (customRecipients) {
      const extraList = customRecipients.split(',').map(e => e.trim()).filter(Boolean);
      for (const extraEmail of extraList) {
        try {
          const result = await mailer.sendODEmail({
            student: {
              name: `Department HOD / Class Tutor (${department})`,
              reg: 'DEPT-OD',
              dept: department,
              year: 'All Years'
            },
            recipientEmail: extraEmail,
            eventDetails,
            customSubject: subject || `🏛️ Official NEC Sports OD Sanction Order for Students — ${evName}`,
            customRemarks: `Batch Summary Copy for ${students.length} student(s).\n${customRemarks}`
          });
          dispatchResults.push(result);
          sentEmails.push(extraEmail);
        } catch (err) {
          console.error(`Failed to send email copy to ${extraEmail}:`, err.message);
        }
      }
    }

    const overallMode = dispatchResults.some(r => r.mode === 'smtp') ? 'smtp' : 'simulated';

    // Store in email dispatches log
    const dispatchRecord = {
      id: Date.now(),
      refNo,
      eventName: evName,
      department,
      studentCount: students.length,
      recipients: sentEmails,
      sender: req.user?.name || 'PT Staff Coordinator',
      mode: overallMode,
      timestamp: new Date().toISOString(),
      remarks: customRemarks
    };

    const dispatches = db.get('emailDispatches') || [];
    dispatches.push(dispatchRecord);
    db.set('emailDispatches', dispatches);

    // Audit log
    db.logAudit(
      req.user?.name || 'Staff',
      'Dispatched OD via Email',
      refNo,
      `Sent OD letters to ${sentEmails.length} recipient(s) (${overallMode} mode)`
    );

    res.json({
      success: true,
      mode: overallMode,
      message: `Official OD letter emailed successfully to ${sentEmails.length} recipient(s)!`,
      totalSent: sentEmails.length,
      recipients: sentEmails,
      batchRefNo: refNo,
      dispatchedAt: dispatchRecord.timestamp,
      previewHtml: mailer.generateODLetterHtml({
        student: students[0] || { name: 'Student Athlete', reg: '24104016', dept: department, year: 'III Year' },
        ...eventDetails,
        remarks: customRemarks
      })
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to dispatch OD emails', error: err.message });
  }
};

module.exports = {
  autoGenerateOD,
  getODBatches,
  getODBatchById,
  updateODStatus,
  getStudentOD,
  deleteODBatch,
  getODAnalytics,
  getHODWhatsAppOD,
  emailDispatchOD
};
