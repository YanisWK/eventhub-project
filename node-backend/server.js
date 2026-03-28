const express = require('express');
const cors = require('cors');

const eventRoutes = require('./routes/events');
const participantRoutes = require('./routes/participants');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'EventHub Node API is running' });
});

app.use('/api/events', eventRoutes);
app.use('/api/participants', participantRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});