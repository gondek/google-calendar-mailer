google-calendar-mailer
======================

[![Dependency Status](https://david-dm.org/gondek/google-calendar-mailer.svg)](https://david-dm.org/gondek/google-calendar-mailer)

A utility for emailing Google Calendar events that match certain criteria. Uses [Nodemailer](https://github.com/nodemailer/nodemailer) and [Moment](https://github.com/moment/moment).

## Setup & Usage

1. Install [Node.js](https://nodejs.org/) (version 6 or greater)
2. Run `npm install -g google-calendar-mailer`
3. Create an app on the Google Developer Console. See "Step 1" on [this page](https://developers.google.com/google-apps/calendar/quickstart/nodejs).
4. Create a task file. See [`taskfile.sample.js`](taskfile.sample.js) for an example.
5. Run the task file with `google-calendar-mailer <taskfile>` (ensure the npm global `bin` folder is in your `$PATH`)
