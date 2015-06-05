var CalendarApi = require('./CalendarApi');

module.exports = CalendarMailer;

function CalendarMailer(configFunction) {
  var tasks = this.tasks = [];
  var settings = this.settings = {};

  configFunction({
    initConfig: function(settingsData) {
      settings = settingsData;
    },
    registerTask: function(name, data) {
      data.name = name;
      tasks.push(data);
    }
  });

  this.api = new CalendarApi(settings.apiCredentials);
}

CalendarMailer.prototype.setup = function() {

};

CalendarMailer.prototype.runTasks = function() {
  this.tasks.forEach(function(task) {
    console.log('- ' + task.name);
    // magic goes here
  });
};

