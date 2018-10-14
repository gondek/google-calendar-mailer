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
      // see the 'nodemailer' project documentation
      transport: { service: 'Gmail', auth: { user: 'youraccount@gmail.com', pass: 'password' } },
      from: 'Calendar Mailer <youraccount@gmail.com>',
      to: 'youraccount@gmail.com'
    }
  },
  tasks: (addTask, moment, userTimeZone) => {
    // Use 'addTask' to define tasks that fetch and email events. See below for more info.

    // 'moment' is an instance of 'moment-timezone'
    // Its default timezone is set to 'userTimeZone'

    // 'userTimeZone' is the one set in the Google Calendars options panel for the account (eg. 'Europe/Zurich')
    // This might be useful if you are travelling and/or have calendars in multiple timezones

    // 'inDays' is just a utility function for this example; it can be removed
    function inDays (n) {
      return moment().add(n, 'days').startOf('day').format()
    }

    addTask({
      // 'name' is used for logging
      name: `Today's Items`,
      // 'parameters' are passed to the events.list Google Calendar API endpoint
      // See https://developers.google.com/calendar/v3/reference/events/list
      parameters: {
        calendarId: 'primary',
        timeMin: inDays(0),
        timeMax: inDays(1),
        timeZone: userTimeZone,
        singleEvents: true
      },
      // 'action' is a function that accepts two parameters:
      // - 'events': a list of events from the API
      //             See https://developers.google.com/calendar/v3/reference/events#resource
      // - 'taskName': the name of the currently running task (as defined above)
      // The function should return a list of objects in the format: ['<subject>', '<body>']
      // which will be sent as emails using the above configuration
      action: (events, taskName) => {
        return events.map(event => [
          'subject', // this will be the subject of the email
          'body' // this will be the body of the email
        ])
      }
    })

    addTask({
      name: `Tomorrow's Events`,
      parameters: {
        calendarId: 'primary',
        timeMin: inDays(1),
        timeMax: inDays(2),
        timeZone: userTimeZone,
        singleEvents: true
      }
    })

    // TODO
    // The ("successful") output of running this taskfile would be something like:
    //
    // Running task Today's Items (1 events)
    //   - Sent "[Today's Items] Work on new CSS framework"
    // Running task Tomorrow's Events (2 events)
    //   - Sent "[Tomorrow's Events] Prepare for barbeque party"
    //   - Sent "[Tomorrow's Events] Follow up on new job contracts"
    //
    // The emails received would have the subject lines as above, with the event description as the email body.
  }
}
