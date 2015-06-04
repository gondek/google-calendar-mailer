module.exports = function(gcm) {

  gcm.initConfig({
    api: {
      token_path: '',
      client_secret_path: ''
    },
    mail_transport: {
      service: 'gmail',
      auth: {
        user: 'sender@gmail.com',
        pass: 'password'
      }
    },
    mail_options: {
      from: 'sender@address',
      to: 'receiver@address',
      subject: '[Event] <%= event.summary %>',
      text: 'google-calendar-mailer is notifying you of this event. \n\n<%= event.description %>'
    }
  });

  gcm.registerTask('Recurring Events: Tickler', {
    parameters: {
      calendarId: 'hehnre67phih5mu0d3hsbl93n4'
    },
    mailOptions: {
      subject: '[Tickler] <%= event.summary %>',
      text: '<%= event.description %>'
    }
  });

};
