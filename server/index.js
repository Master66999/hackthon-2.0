const path = require('path');
// Load .env explicitly from server/.env regardless of current working directory
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express    = require('express');
const cors       = require('cors');
const passport   = require('passport');
const connectDB  = require('./config/db');

// Passport strategy
require('./config/passport');

const authRoutes = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(passport.initialize());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);

// Health-check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'leafsense-server' }));

// ── Start ──────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🌿  LeafSense Auth server running on http://localhost:${PORT}`);
    console.log(`    MongoDB Atlas connected successfully.\n`);
  });
});
