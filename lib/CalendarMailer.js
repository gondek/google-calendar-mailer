var readline = require('readline');
var googleAuth = require('google-auth-library');
var googleCalendar = require('googleapis').calendar('v3');

module.exports = CalendarMailer;

function CalendarMailer(configurator) {
  var tasks = this.tasks = [];
  var apiSettings = this.apiSettings = {};

  configurator({
    apiConfig: function(settings) {
      apiSettings = settings;
    },
    task: function(name, params, action) {
      tasks.push({
        name: name,
        params: params,
        action: action
      });
    }
  });

  this.api = new CalendarApi(apiSettings);
}

CalendarMailer.prototype.setupApi = function() {
  this.api.authorize();
};

CalendarMailer.prototype.runTasks = function() {
  this.tasks.forEach(function(task) {
    console.log('\nRunning Task : ' + task.name);
  });
};

function CalendarApi(apiSettings) {
  var auth = new googleAuth();
  this.token = apiSettings.token;
  this.oauth2Client = new auth.OAuth2(
    apiSettings.clientId,
    apiSettings.clientSecret,
    apiSettings.redirectUri);
}

CalendarApi.prototype.authorize = function() {
  if (!this.token) {
    this.getNewToken();
  }
  this.oauth2Client.credentials = this.token;
};

CalendarApi.prototype.getNewToken = function() {
  var that = this;
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
    that.oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      that.token = token;
      console.log("Please enter this token in your taskFile: ");
      console.log(token);
    });
  });
};
