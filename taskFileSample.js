module.exports = function(gcm, nodemailer) {

  // Information from the Google Developers Console for your API app
  gcm.api({
    clientId: '12345678910-abcdefghijklmnopqrst.apps.googleusercontent.com',
    clientSecret: 'aBcDeFgHiJkLmNoP',
    redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
    // The token information will be generated during the inital run
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

  function sendEmail(body) {
    transporter.sendMail({
      from: 'Fred Foo <foo@blurdybloop.com>', // sender address
      to: 'bar@blurdybloop.com, baz@blurdybloop.com', // list of receivers
      subject: 'Here\'s a calendar item', // Subject line
      text: body, // plaintext body
    }, function(error, info) {
      if (error) {
        return console.log(error);
      }
      console.log('Message sent: ' + info.response);
    });
  }

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
    events.forEach(function(event) {
      sendEmail(event.summary);
      console.log(event.summary);
    });
  });

};
