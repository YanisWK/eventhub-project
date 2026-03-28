const express = require('express');
const db = require('../models/db');

const router = express.Router();

// GET /api/events
router.get('/', (req, res) => {
  const { status } = req.query;

  let sql = 'SELECT * FROM events';
  const params = [];

  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET /api/events/:id
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM events WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(row);
  });
});

// POST /api/events
router.post('/', (req, res) => {
  const { name, description, date, status } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: 'name and date are required' });
  }

  const sql = `
    INSERT INTO events (name, description, date, status)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [name, description || '', date, status || 'upcoming'], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      name,
      description: description || '',
      date,
      status: status || 'upcoming'
    });
  });
});

// PUT /api/events/:id
router.put('/:id', (req, res) => {
  const { name, description, date, status } = req.body;

  if (!name || !date) {
    return res.status(400).json({ error: 'name and date are required' });
  }

  const sql = `
    UPDATE events
    SET name = ?, description = ?, date = ?, status = ?
    WHERE id = ?
  `;

  db.run(sql, [name, description || '', date, status || 'upcoming', req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      id: Number(req.params.id),
      name,
      description: description || '',
      date,
      status: status || 'upcoming'
    });
  });
});

// DELETE /api/events/:id
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM events WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  });
});

module.exports = router;