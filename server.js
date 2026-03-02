require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('Fatal: JWT_SECRET is required in production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kodflix-auth' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Kodflix auth server running on port ${PORT}`);
});

module.exports = app;
