google-calendar-mailer
======================

[![Dependency Status](https://david-dm.org/gondek/google-calendar-mailer.svg)](https://david-dm.org/gondek/google-calendar-mailer)

Provides an easy way to get Google Calendar events and email them. This package uses [Nodemailer](https://github.com/andris9/Nodemailer).

## Setup & Usage

1. Install [Node.js](https://nodejs.org/)
2. Run `npm install -g google-calendar-mailer`
3. Create an app on the Google Developers Console. See "Step 1" on [this page](https://developers.google.com/google-apps/calendar/quickstart/nodejs).
4. Create a task file. See [`taskFileSample.js`](taskFileSample.js) for an example.
5. Run the task file with `google-calendar-mailer <taskFile>`
