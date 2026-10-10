const db = require('../database/db');

// Get all events with filtering
const getEvents = (req, res) => {
  try {
    const { sport, category, status, search } = req.query;
    let events = db.get('events');
    const participants = db.get('participants');

    // Filter by sport/event name
    if (sport && sport !== 'All') {
      events = events.filter(e => e.name.toLowerCase() === sport.toLowerCase());
    }

    // Filter by category
    if (category && category !== 'All') {
      events = events.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by status
    if (status && status !== 'All') {
      events = events.filter(e => e.status.toLowerCase() === status.toLowerCase());
    }

    // Filter by search term
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.venue || '').toLowerCase().includes(q) ||
        (e.category || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q)
      );
    }

    // Attach participant counts
    const enrichedEvents = events.map(e => {
      const count = participants.filter(p => p.event === e.name).length;
      return {
        ...e,
        participantCount: count,
        isFull: count >= (e.limit || 50)
      };
    });

    res.json({ success: true, count: enrichedEvents.length, data: enrichedEvents });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve events', error: err.message });
  }
};

// Get single event by ID with members list
const getEventById = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const event = db.findOne('events', e => e.id === id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const members = db.find('participants', p => p.event === event.name);

    res.json({
      success: true,
      data: {
        ...event,
        participantCount: members.length,
        members
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch event', error: err.message });
  }
};

// Create new event
const createEvent = (req, res) => {
  try {
    const { name, category, type, venue, date, time, status, limit, description } = req.body;
    if (!name || !venue || !date) {
      return res.status(400).json({ success: false, message: 'Name, venue, and date are required.' });
    }

    const newEvent = {
      id: Date.now(),
      name: name.trim(),
      category: category ? category.trim() : 'Athletics',
      type: type || 'Individual',
      venue: venue.trim(),
      date,
      time: time || '09:00 AM',
      status: status || 'Open',
      limit: parseInt(limit) || 40,
      description: description ? description.trim() : '',
      createdAt: new Date().toISOString()
    };

    db.insert('events', newEvent);

    // Audit and Notification
    db.logAudit(req.user?.name, 'Created Event', newEvent.name, `Venue: ${newEvent.venue}, Date: ${newEvent.date}`);
    db.notify('New Event Scheduled', `${newEvent.name} is scheduled on ${newEvent.date} at ${newEvent.venue}. Registrations open!`, 'event');

    res.status(201).json({ success: true, message: 'Event created successfully', data: newEvent });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create event', error: err.message });
  }
};

// Update event
const updateEvent = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = db.findOne('events', e => e.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const { name, category, type, venue, date, time, status, limit, description } = req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (category) updates.category = category.trim();
    if (type) updates.type = type;
    if (venue) updates.venue = venue.trim();
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (status) updates.status = status;
    if (limit) updates.limit = parseInt(limit);
    if (description !== undefined) updates.description = description.trim();
    if (req.body.results) updates.results = req.body.results;

    // Check for critical changes to notify participants
    if (updates.venue && updates.venue !== existing.venue) {
      db.notify('Venue Update', `${existing.name} venue has been changed to ${updates.venue}.`, 'alert');
    }
    if (updates.date && updates.date !== existing.date) {
      db.notify('Date Rescheduled', `${existing.name} date has been rescheduled to ${updates.date}.`, 'alert');
    }

    const updated = db.update('events', e => e.id === id, updates);

    db.logAudit(req.user?.name, 'Updated Event', updated.name, `Updated fields: ${Object.keys(updates).join(', ')}`);

    res.json({ success: true, message: 'Event updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update event', error: err.message });
  }
};

// Conclude event and publish results with automated notifications & points
const concludeEvent = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = db.findOne('events', e => e.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const {
      winner,
      winnerPoints = 50,
      runnerUp,
      runnerPoints = 30,
      scoreDifference,
      topPerformer = '',
      summary = '',
      autoAwardPoints = true
    } = req.body;

    if (!winner || !runnerUp) {
      return res.status(400).json({ success: false, message: 'Winner and Runner-up are required to conclude the event.' });
    }

    const winPts = parseInt(winnerPoints) || 0;
    const runPts = parseInt(runnerPoints) || 0;
    const calcDiff = scoreDifference !== undefined && scoreDifference !== '' 
      ? parseInt(scoreDifference) 
      : Math.abs(winPts - runPts);

    const results = {
      winner: String(winner).trim(),
      winnerPoints: winPts,
      runnerUp: String(runnerUp).trim(),
      runnerPoints: runPts,
      scoreDifference: calcDiff,
      topPerformer: String(topPerformer || '').trim(),
      summary: String(summary || '').trim(),
      concludedAt: new Date().toISOString(),
      concludedBy: req.user?.name || 'Sports Coordinator'
    };

    // Update event record
    const updated = db.update('events', e => e.id === id, {
      status: 'Completed',
      results
    });

    // Auto-award points to department leaderboard if enabled
    if (autoAwardPoints) {
      const deptPoints = db.get('points') || {};
      const cleanWin = results.winner.toUpperCase();
      const cleanRun = results.runnerUp.toUpperCase();

      if (deptPoints[cleanWin] !== undefined) {
        deptPoints[cleanWin] = (deptPoints[cleanWin] || 0) + winPts;
      }
      if (deptPoints[cleanRun] !== undefined) {
        deptPoints[cleanRun] = (deptPoints[cleanRun] || 0) + runPts;
      }
      db.set('points', deptPoints);

      db.logAudit(
        req.user?.name,
        'Awarded Tournament Points',
        existing.name,
        `Winner ${results.winner} (+${winPts} pts), Runner ${results.runnerUp} (+${runPts} pts)`
      );
    }

    // Retrieve all participants for this event
    const participants = db.find('participants', p => (p.event || '').toLowerCase() === existing.name.toLowerCase());

    // 1. Broadcast notification to all users
    const broadcastTitle = `🏆 Event Concluded: ${existing.name} — ${results.winner} Wins!`;
    const broadcastBody = `Winner: ${results.winner} (${winPts} pts) | Runner-Up: ${results.runnerUp} (${runPts} pts) | Score Difference: ${calcDiff} pts! ${results.summary ? `\n"${results.summary}"` : ''}`;
    db.notify(broadcastTitle, broadcastBody, 'result', 'all');

    // 2. Direct personalized notification to each participant
    participants.forEach(p => {
      db.notify(
        `🏆 Results Published: ${existing.name}`,
        `Hi ${p.name}! ${existing.name} results are out. Winner: ${results.winner} (${winPts} pts), Runner-Up: ${results.runnerUp} (${runPts} pts). Score Difference: ${calcDiff} pts lead. Thank you for your active participation!`,
        'result',
        'student',
        p.reg
      );
    });

    // 3. Generate Official WhatsApp Message Template
    const whatsappText = `🏛️ *NATIONAL ENGINEERING COLLEGE (AUTONOMOUS)*\n` +
      `🏆 *DEPARTMENT OF PHYSICAL EDUCATION & SPORTS*\n` +
      `-----------------------------------------\n` +
      `📢 *OFFICIAL TOURNAMENT RESULT ANNOUNCEMENT*\n\n` +
      `🏅 *Event:* ${existing.name}\n` +
      `📅 *Date:* ${existing.date} | 📍 *Venue:* ${existing.venue}\n\n` +
      `🥇 *CHAMPION / WINNER:* *${results.winner}* (${winPts} Points)\n` +
      `🥈 *RUNNER-UP:* *${results.runnerUp}* (${runPts} Points)\n` +
      `⚡ *SCORE DIFFERENCE:* *${calcDiff} Points Margin*\n` +
      (results.topPerformer ? `⭐ *TOP PERFORMER / MVP:* ${results.topPerformer}\n` : '') +
      (results.summary ? `📝 *Match Highlights:* ${results.summary}\n` : '') +
      `\n📊 *College Championship Points Standings Updated!*\n` +
      `🎉 Hearty congratulations to the winning squad and all athletes!\n` +
      `-----------------------------------------\n` +
      `_Department of Physical Education, NEC Kovilpatti_`;

    db.logAudit(req.user?.name, 'Concluded Event & Notified', existing.name, `Winner: ${results.winner}, Participants notified: ${participants.length}`);

    res.json({
      success: true,
      message: `Event concluded successfully! Official results published and notifications dispatched to ${participants.length} participant(s).`,
      data: updated,
      results,
      participantCount: participants.length,
      participants,
      whatsappText
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to conclude event', error: err.message });
  }
};

// Delete event
const deleteEvent = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = db.findOne('events', e => e.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    db.delete('events', e => e.id === id);
    db.logAudit(req.user?.name, 'Deleted Event', existing.name, `Event ID ${id} deleted`);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete event', error: err.message });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  concludeEvent,
  deleteEvent
};
