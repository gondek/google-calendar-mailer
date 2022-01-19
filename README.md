google-calendar-mailer
======================

[![Libraries.io dependency status](https://img.shields.io/librariesio/release/npm/google-calendar-mailer)](https://libraries.io/github/gondek/google-calendar-mailer)
[![npm](https://img.shields.io/npm/v/google-calendar-mailer.svg)](https://www.npmjs.com/package/google-calendar-mailer)

A utility for emailing Google Calendar events that match certain criteria. See [`taskfile.sample.js`](taskfile.sample.js) for an example of what this package can do.

Uses [Nodemailer](https://github.com/nodemailer/nodemailer) and [Moment](https://github.com/moment/moment).

## Setup & Usage

1. Install [Node.js](https://nodejs.org/) (at least 12+)
2. Run `npm install -g google-calendar-mailer`
3. Create an app on the Google Developer Console. See "Step 1" on [this page](https://developers.google.com/google-apps/calendar/quickstart/nodejs).
4. Create a task file. See [`taskfile.sample.js`](taskfile.sample.js) for the documentation.
5. Run the task file with `google-calendar-mailer <taskfile>` (ensure the npm global `bin` folder is in your `$PATH`)
    - If you are running google-calendar-mailer for the first time, you will be prompted to generate an access token which you can paste into the task file.
    - The program can also be called with a `-c` (cron / non-interactive mode) flag: `google-calendar-mailer -c <taskfile>`. This disables user input for token generation. If the token is missing or is invalid, the program will exit with an error code of 1.
