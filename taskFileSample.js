// The taskfile should export a function that takes in:
// 1) a google-calendar-mailer instance
// 2) a nodemailer instance
module.exports = function(gcm, nodemailer) {

  // Information from the Google Developers Console for your API app
  // always set this first
  gcm.api({
    clientId: '12345678910-abcdefghijklmnopqrst.apps.googleusercontent.com',
    clientSecret: 'aBcDeFgHiJkLmNoP',
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
    // The token information will be generated during the first run; leave blank initially
    token: {}
  });

  // See https://github.com/andris9/Nodemailer for usage information
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'gmail.user@gmail.com',
      pass: 'userpass'
    }
  });

  // This is just a helper function; you don't need it
  function sendEmail(body) {
    transporter.sendMail({
      from: 'Fred Foo <foo@blurdybloop.com>', // sender address
      to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
      subject: 'Here\'s a calendar item', // Subject line
      text: body, // plaintext body
    }, function(error, info) {
      if (error) {
        // if sending lots of messages, things tend to time out
        // I recommend adding in some logic here to retry sending the email
        return console.log(error);
      }
      console.log('Message sent: ' + info.response);
    });
  }

  // one can define multiple tasks using gcm.task
  gcm.task('Task Name', {
    // calendarId is mandatory
    calendarId: 'primary',
    // See the following URL for other request parameters
    // https://developers.google.com/google-apps/calendar/v3/reference/events/list
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(events) {
    // A list of the matched events. May be empty.
    // see https://developers.google.com/google-apps/calendar/v3/reference/events#resource-representations
    events.forEach(function(event) {
      sendEmail(event.summary);
      console.log(event.summary);
    });
  });

};
