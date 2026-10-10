const db = require('../database/db');

// Get notifications with role filtering and category statistics
const getNotifications = (req, res) => {
  try {
    let notifications = db.get('notifications') || [];
    const user = req.user;
    const { type, read, search, limit } = req.query;

    // Filter relevant notifications for current user
    if (user) {
      notifications = notifications.filter(n => {
        if (!n.targetRole || n.targetRole === 'all') return true;
        if (n.targetRole === user.role) return true;
        if (n.targetReg && user.reg && n.targetReg.toLowerCase() === user.reg.toLowerCase()) return true;
        return false;
      });
    }

    // Type filter
    if (type && type !== 'all') {
      notifications = notifications.filter(n => (n.type || 'general').toLowerCase() === type.toLowerCase());
    }

    // Read filter
    if (read !== undefined) {
      const isRead = read === 'true';
      notifications = notifications.filter(n => n.read === isRead);
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      notifications = notifications.filter(n =>
        (n.title || '').toLowerCase().includes(q) ||
        (n.body || '').toLowerCase().includes(q) ||
        (n.type || '').toLowerCase().includes(q)
      );
    }

    // Compute stats
    const allUserNotifs = (db.get('notifications') || []).filter(n => {
      if (!user) return true;
      if (!n.targetRole || n.targetRole === 'all') return true;
      if (n.targetRole === user.role) return true;
      if (n.targetReg && user.reg && n.targetReg.toLowerCase() === user.reg.toLowerCase()) return true;
      return false;
    });

    const unreadCount = allUserNotifs.filter(n => !n.read).length;
    const categoryStats = {
      total: allUserNotifs.length,
      unread: unreadCount,
      results: allUserNotifs.filter(n => n.type === 'result').length,
      od: allUserNotifs.filter(n => n.type === 'od').length,
      points: allUserNotifs.filter(n => n.type === 'points').length,
      alerts: allUserNotifs.filter(n => n.type === 'alert' || n.type === 'system').length,
      general: allUserNotifs.filter(n => n.type === 'general' || !n.type).length
    };

    if (limit) {
      notifications = notifications.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      unreadCount,
      count: notifications.length,
      categoryStats,
      data: notifications
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications', error: err.message });
  }
};

// Mark all as read
const markAllRead = (req, res) => {
  try {
    const notifications = db.get('notifications') || [];
    const user = req.user;

    notifications.forEach(n => {
      if (!user) {
        n.read = true;
      } else {
        if (!n.targetRole || n.targetRole === 'all' || n.targetRole === user.role || (n.targetReg && user.reg && n.targetReg.toLowerCase() === user.reg.toLowerCase())) {
          n.read = true;
        }
      }
    });
    db.save();

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notifications', error: err.message });
  }
};

// Mark single notification as read
const markOneRead = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = db.update('notifications', n => n.id === id, { read: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification marked as read', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification', error: err.message });
  }
};

// Delete single notification
const deleteNotification = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = db.delete('notifications', n => n.id === id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete notification', error: err.message });
  }
};

// Clear all notifications
const clearAll = (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role === 'admin' || user.role === 'staff') {
      db.set('notifications', []);
    } else {
      // For student, remove only targeted to student
      const remaining = db.get('notifications').filter(n => n.targetReg && n.targetReg.toLowerCase() !== (user.reg || '').toLowerCase());
      db.set('notifications', remaining);
    }
    res.json({ success: true, message: 'Notifications cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear notifications', error: err.message });
  }
};

// Create a notification (broadcast or targeted)
const createNotification = (req, res) => {
  try {
    const { title, body, type = 'general', targetRole = 'all', targetReg = null, metadata = null } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body are required.' });
    }

    const item = db.notify(title.trim(), body.trim(), type, targetRole, targetReg, metadata);
    db.logAudit(req.user?.name, 'Broadcasted Notification', title, body);

    res.status(201).json({ success: true, message: 'Notification broadcasted', data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create notification', error: err.message });
  }
};

module.exports = {
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
  clearAll,
  createNotification
};
