const fs = require('fs');
const path = require('path');
const seedData = require('./seedData');

const DB_FILE = path.join(__dirname, 'nec_sports_db.json');

class Database {
  constructor() {
    this.data = null;
    this.lastMtime = 0;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stat = fs.statSync(DB_FILE);
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        this.lastMtime = stat.mtimeMs;
        // Ensure new collections exist in case of upgrade
        if (!this.data.odBatches) this.data.odBatches = seedData.odBatches;
        if (!this.data.audit) this.data.audit = seedData.audit;
        if (!this.data.attendance) this.data.attendance = seedData.attendance;
        if (!this.data.notifications) this.data.notifications = seedData.notifications;
      } else {
        this.data = JSON.parse(JSON.stringify(seedData));
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database, using seed data fallback:', err.message);
      this.data = JSON.parse(JSON.stringify(seedData));
      this.save();
    }
  }

  reload() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stat = fs.statSync(DB_FILE);
        if (!this.lastMtime || stat.mtimeMs > this.lastMtime) {
          const raw = fs.readFileSync(DB_FILE, 'utf8');
          this.data = JSON.parse(raw);
          this.lastMtime = stat.mtimeMs;
        }
      }
    } catch (e) {}
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_FILE);
      if (fs.existsSync(DB_FILE)) {
        this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
      }
    } catch (err) {
      console.error('Error saving database:', err.message);
    }
  }

  // Generic getter
  get(collection) {
    this.reload();
    if (!this.data || !this.data[collection]) {
      if (!this.data) this.data = {};
      this.data[collection] = [];
    }
    return this.data[collection];
  }

  // Set collection
  set(collection, value) {
    this.data[collection] = value;
    this.save();
    return this.data[collection];
  }

  // Find items
  find(collection, filterFn) {
    const items = this.get(collection);
    return filterFn ? items.filter(filterFn) : items;
  }

  // Find single item
  findOne(collection, filterFn) {
    const items = this.get(collection);
    return items.find(filterFn) || null;
  }

  // Insert item
  insert(collection, item) {
    const items = this.get(collection);
    if (!item.id) {
      item.id = Date.now() + Math.floor(Math.random() * 1000);
    }
    items.push(item);
    this.save();
    return item;
  }

  // Update item
  update(collection, filterFn, updateData) {
    const items = this.get(collection);
    const index = items.findIndex(filterFn);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updateData };
    this.save();
    return items[index];
  }

  // Delete item
  delete(collection, filterFn) {
    const items = this.get(collection);
    const initialLength = items.length;
    this.data[collection] = items.filter(item => !filterFn(item));
    this.save();
    return initialLength !== this.data[collection].length;
  }

  // Audit logging helper
  logAudit(actor, action, target, detail, ip = '') {
    const record = {
      id: Date.now() + Math.floor(Math.random() * 100),
      actor: actor || 'System',
      action,
      target,
      detail: typeof detail === 'object' ? JSON.stringify(detail) : String(detail || ''),
      date: new Date().toLocaleString(),
      ip
    };
    if (!this.data.audit) this.data.audit = [];
    this.data.audit.unshift(record);
    if (this.data.audit.length > 500) this.data.audit.pop();
    this.save();
    return record;
  }

  // Notification helper
  notify(title, body, type = 'general', targetRole = 'all', targetReg = null, metadata = null) {
    const item = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      title,
      body,
      type,
      targetRole,
      targetReg,
      metadata: metadata || null,
      date: new Date().toLocaleString(),
      createdAt: new Date().toISOString(),
      read: false
    };
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.unshift(item);
    if (this.data.notifications.length > 300) this.data.notifications.pop();
    this.save();
    return item;
  }
}

const db = new Database();
module.exports = db;
