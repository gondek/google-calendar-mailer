var readline = require('readline');
var googleAuth = require('google-auth-library');
var googleCalendar = require('googleapis').calendar('v3');
var _ = require('underscore');

module.exports = calendarInterface;

function calendarInterface() {
  var apiCredentials;
  var tasks = [];

  function setCredentials(data) {
    var auth = new googleAuth();
    apiCredentials =
      new auth.OAuth2(data.clientId, data.clientSecret, data.redirectUri);
    apiCredentials.credentials = data.token;
  }

  function addTask(name, requestParams, action) {
    tasks.push({
      name: name,
      requestParams: requestParams,
      action: action
    });
  }

  function authorized(yesCallback, noCallback) {
    googleCalendar.events.list({
        auth: apiCredentials,
        calendarId: 'primary',
      },
      function(err, response) {
        if (err && noCallback) {
          noCallback();
        }
        if(!err && yesCallback) {
          yesCallback();
        }
      }
    );
  }

  function runTasks() {
    tasks.forEach(function(task) {
      googleCalendar.events.list(
        _.extend({
            auth: apiCredentials
          },
          task.requestParams
        ),
        function(err, response) {
          if (err) {
            console.log('On task "' + task.name + '", the API returned an error: ' + err);
            return;
          }
          console.log('Starting task: ' + task.name);
          task.action(response.items);
        });
    });
  }

  function getNewToken() {
    if(!apiCredentials) {
      console.log('No API client information found. Please see README.md for information');
      return;
    }
    var authUrl = apiCredentials.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly']
    });
    console.log('Authorize this app by visiting this url: \n\n' + authUrl + '\n');
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();
      apiCredentials.getToken(code, function(err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        console.log("\nPlease enter this token in your taskFile:\n");
        console.log(token);
      });
    });
  }

  return {
    setCredentials: setCredentials,
    addTask: addTask,
    runTasks: runTasks,
    getNewToken: getNewToken,
    authorized: authorized
  };
}
