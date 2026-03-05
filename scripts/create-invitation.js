/**
 * Creates a single invitation and prints the registration link.
 * Run: npm run create-invitation -- --email user@example.com [--lang es]
 * Optional: INVITATION_EXPIRY_DAYS=7 (default) or set in .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Invitation = require('../src/models/Invitation');

const EXPIRY_DAYS = parseInt(process.env.INVITATION_EXPIRY_DAYS, 10) || 7;

const MESSAGES = {
  en: (link) => `You have been invited to join GymBro.\n\nUse the following link to create your account:\n\n${link}\n\nThis link expires in ${EXPIRY_DAYS} days.`,
  es: (link) => `Has sido invitado a unirte a GymBro.\n\nUsa el siguiente enlace para crear tu cuenta:\n\n${link}\n\nEste enlace expira en ${EXPIRY_DAYS} días.`,
};

const SUBJECTS = {
  en: 'You are invited to GymBro',
  es: 'Estás invitado a GymBro',
};

function parseArgs() {
  const args = process.argv.slice(2);
  const email = args[args.indexOf('--email') + 1] || null;
  const lang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'en';
  return { email, lang: ['en', 'es'].includes(lang) ? lang : 'en' };
}

async function sendEmail(to, subject, body) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject,
    text: body,
  });
}

async function main() {
  const { email, lang } = parseArgs();

  await mongoose.connect(process.env.MONGODB_URI);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);
  const inv = await Invitation.create({ expiresAt, email: email || null, lang });
  const baseUrl = process.env.INVITATION_BASE_URL || process.env.APP_URL || 'http://localhost:3000';
  const link = `${baseUrl}/register?invitation=${inv.token}`;

  console.log('Invitation created. Expires at:', expiresAt.toISOString());
  console.log('Registration link:\n', link);

  if (email) {
    await sendEmail(email, SUBJECTS[lang], MESSAGES[lang](link));
    console.log(`\nInvitation email sent to ${email} (${lang})`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
