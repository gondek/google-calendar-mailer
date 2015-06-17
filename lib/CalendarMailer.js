var readline = require('readline');
var googleAuth = require('google-auth-library');
var googleCalendar = require('googleapis').calendar('v3');
var _ = require('underscore');

module.exports = calendarMailer;

function newCalendarInterface() {
  return (function() {
    var apiCredentials;
    var tasks = [];

    function setCredentials(data) {
      var auth = new googleAuth();
      apiCredentials =
        new auth.OAuth2(data.clientId, data.clientSecret, data.redirectUri);
      apiCredentials.credentials = data.token;
    }

    function addTask(name, queryParams, action) {
      tasks.push({
        name: name,
        queryParams: queryParams,
        action: action
      });
    }

    function runTasks() {
      tasks.forEach(function(task) {
        googleCalendar.events.list(
          _.extend({
              auth: apiCredentials
            },
            task.queryParams
          ),
          function(err, response) {
            if (err) {
              console.log('On task "' + task.name +  '" The API returned an error: ' + err);
              return;
            }
            console.log('Starting task: ' + task.name);
            task.action(response.items);
          });
      });
    }

    return {
      setCredentials: setCredentials,
      addTask: addTask,
      runTasks: runTasks
    };

  })();
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
  console.log('Authorize this app by visiting this url: \n', authUrl);
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
