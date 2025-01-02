const SessionNote = require('../models/sessionNotes');
const User = require('../models/users');
const nodemailer = require('nodemailer');
const { format, parse } = require('date-fns');
const cron = require('node-cron');

class SessionController {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    this.initializeReminders();
  }

  async sendEmail(to, subject, text) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };
    return await this.transporter.sendMail(mailOptions);
  }

  async sendSessionConfirmation(userEmail, sessionDate, title) {
    const formattedDate = format(new Date(sessionDate), 'MM/dd/yyyy HH:mm');
    await this.sendEmail(
      userEmail,
      'Session Scheduled Confirmation',
      `Your session "${title}" has been scheduled for ${formattedDate}.`
    );
  }

  async sendReminderEmail(userEmail, sessionDate, title) {
    const formattedDate = format(new Date(sessionDate), 'MM/dd/yyyy HH:mm');
    await this.sendEmail(
      userEmail,
      'Session Reminder',
      `Reminder: Your session "${title}" is scheduled for tomorrow at ${formattedDate}.`
    );
  }

  initializeReminders() {
    cron.schedule('0 0 * * *', async () => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        const upcomingSessions = await SessionNote.find({
          sessionDate: {
            $gte: tomorrow,
            $lte: endOfTomorrow,
          },
          reminderSent: false,
        }).populate('userId', 'email');

        for (const session of upcomingSessions) {
          if (session.userId && session.userId.email) {
            await this.sendReminderEmail(
              session.userId.email,
              session.sessionDate,
              session.title
            );
            session.reminderSent = true;
            await session.save();
          }
        }
      } catch (error) {
        console.error('Error in reminder cron job:', error);
      }
    });
  }

  async renderAddSessionPage(req, res) {
    try {
      const userId = req.user.id;
      const sessionNotes = await SessionNote.find({ userId });
      res.render('addSessionNote', {
        error: null,
        success: null,
        sessionNotes,
      });
    } catch (error) {
      res.render('addSessionNote', {
        error: 'Error loading page',
        success: null,
        sessionNotes: [],
      });
    }
  }

  async addSessionNote(req, res) {
    try {
      const { title, notes, sessionDate } = req.body;
      const userId = req.user.id;
  
      // Validate and parse the sessionDate
      const parsedDate = new Date(sessionDate);  // Change this line to use the ISO format directly.
  
      // Check if the date is valid
      if (isNaN(parsedDate)) {
        throw new Error('Invalid session date provided.');
      }
  
      const newNote = new SessionNote({
        userId,
        title,
        sessionDate: parsedDate,
        notes,
      });
  
      await newNote.save();
  
      const user = await User.findById(userId);
      if (user && user.email) {
        await this.sendSessionConfirmation(user.email, parsedDate, title);
      }
  
      res.render('addSessionNote', {
        error: null,
        success: 'Session note added successfully! A confirmation email has been sent.',
        sessionNotes: await SessionNote.find({ userId }),
      });
    } catch (error) {
      console.error('Error adding session note:', error.message);
      res.render('addSessionNote', {
        error: error.message || 'Failed to save session note.',
        success: null,
        sessionNotes: [],
      });
    }
  }

  async getSessionNotes(req, res) {
    try {
      const userId = req.user.id;
      const notes = await SessionNote.find({ userId }).sort({ sessionDate: -1 });
      res.json({ success: true, data: notes });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching session notes', error });
    }
  }

  async renderSessionNotesList(req, res) {
    try {
      const userId = req.user.id;
      const notes = await SessionNote.find({ userId }).sort({ sessionDate: -1 });
      res.render('sessionNotes', { notes, error: null });
    } catch (error) {
      res.render('sessionNotes', { notes: [], error: 'Error fetching session notes' });
    }
  }
}

module.exports = new SessionController();
