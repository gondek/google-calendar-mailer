var readline = require('readline');
var googleAuth = require('google-auth-library');
var googleCalendar = require('googleapis').calendar('v3');
var _ = require('underscore');

module.exports = CalendarApi;

function CalendarApi(apiCredentials) {
  var auth = new googleAuth();
  this.oauth2Client = new auth.OAuth2(
    apiCredentials.clientId,
    apiCredentials.clientSecret,
    apiCredentials.redirectUri);
}

CalendarApi.prototype.authorize = function(apiCredentials) {
  if (!apiCredentials.token) {
    getNewToken();
  } else {
    oauth2Client.credentials = apiCredentials.token;
  }
};

CalendarApi.prototype.function getNewToken() {
  var authUrl = this.oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
    });
  });
}

