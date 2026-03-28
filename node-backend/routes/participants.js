const express = require('express');
const db = require('../models/db');

const router = express.Router();

// GET /api/participants
router.get('/', (req, res) => {
  db.all('SELECT * FROM participants', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET /api/participants/:id
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM participants WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.json(row);
  });
});

// POST /api/participants
router.post('/', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  db.run(
    'INSERT INTO participants (name, email) VALUES (?, ?)',
    [name, email],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        name,
        email
      });
    }
  );
});

// PUT /api/participants/:id
router.put('/:id', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  db.run(
    'UPDATE participants SET name = ?, email = ? WHERE id = ?',
    [name, email, req.params.id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      res.json({
        id: Number(req.params.id),
        name,
        email
      });
    }
  );
});

// DELETE /api/participants/:id
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM participants WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    res.json({ message: 'Participant deleted successfully' });
  });
});

module.exports = router;