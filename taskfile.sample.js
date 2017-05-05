// A taskfile should export an object with a 'settings' key and a 'tasks' key
module.exports = {
  settings: {
    // Enter information from the Google Developer Console here
    clientId: 'yourappid.apps.googleusercontent.com',
    clientSecret: 'yourclientsecret',
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
    // If the token is left empty, it will be generated using the above credentials during the initial run
    token: {},
    mailer: {
      // 'transport' can be any valid argument to nodemailer.createTransport(...)
      transport: {service: 'Gmail', auth: {user: 'youraccount@gmail.com', pass: 'password'}},
      from: 'Calendar Mailer <youraccount@gmail.com>',
      to: 'youraccount@gmail.com'
    }
  },
  tasks: (addTask, moment) => {
    // Use addTask to define tasks. Parameters are passed to the events.list Google Calendar API endpoint
    // See https://developers.google.com/google-apps/calendar/v3/reference/events/list

    // 'moment' is an instance of 'moment-timezone'
    // Its default timezone is the one set in the Google Calendars options panel for the account

    // The ("successful") output of running this taskfile would be something like:
    //
    // Running task Today's Items (1 events)
    //   - Sent "[Today's Items] Work on new CSS framework"
    // Running task Tomorrow's Events (2 events)
    //   - Sent "[Tomorrow's Events] Prepare for barbeque party"
    //   - Sent "[Tomorrow's Events] Follow up on new job contracts"
    //
    // The emails received would have the subject lines as above, with the event description as the email body.

    function inDays (n) {
      return moment().add(n, 'days').startOf('day').format()
    }

    addTask({
      name: `Today's Items`,
      parameters: {
        calendarId: 'primary',
        timeMin: inDays(0),
        timeMax: inDays(1),
        singleEvents: true
      }
    })

    addTask({
      name: `Tomorrow's Events`,
      parameters: {
        calendarId: 'primary',
        timeMin: inDays(1),
        timeMax: inDays(2),
        singleEvents: true
      }
    })
  }
}
