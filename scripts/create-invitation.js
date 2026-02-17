/**
 * Creates a single invitation and prints the registration link.
 * Run: node scripts/create-invitation.js
 * Optional: INVITATION_EXPIRY_DAYS=7 (default) or set in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Invitation = require('../src/models/Invitation');

const EXPIRY_DAYS = parseInt(process.env.INVITATION_EXPIRY_DAYS, 10) || 7;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);
  const inv = await Invitation.create({ expiresAt });
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const link = `${baseUrl}/register?invitation=${inv.token}`;
  console.log('Invitation created. Expires at:', expiresAt.toISOString());
  console.log('Registration link:\n', link);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
