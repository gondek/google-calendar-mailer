var calendarApi = require('./calendarApi');

module.exports = CalendarMailer;

function CalendarMailer(configFunction) {
  var tasks = this.tasks = [];
  var globalSettings = this.globalSettings = {};

  configFunction({
    initConfig: function(settings) {
      globalSettings = settings;
    },
    registerTask: function(name, settings) {
      settings.name = name;
      tasks.push(settings);
    }
  });
}

CalendarMailer.prototype.setup = function() {
  // magic goes here
};

CalendarMailer.prototype.runTasks = function() {
  this.tasks.forEach(function(task) {
    console.log('- ' + task.name);
    // magic goes here
  });
};

