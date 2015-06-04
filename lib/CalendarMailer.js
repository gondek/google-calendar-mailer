var calendarApi = require('./calendarApi');

module.exports = CalendarMailer;

function CalendarMailer(configFunction) {
  this.tasks = [];
  this.globalSettings = {};

  configFunction({
    initConfig: this.initConfig,
    registerTask: this.registerTask
  });
}

CalendarMailer.prototype.initConfig = function(settings) {
  this.globalSettings = settings;
};

CalendarMailer.prototype.registerTask = function(name, settings) {
  settings.name = name;
  parent.tasks.push(settings);
};

CalendarMailer.prototype.setup = function() {
  // magic goes here
};

CalendarMailer.prototype.runTasks = function() {
  tasks.forEach(function(task) {
    console.log('\nRunning task: ' + task.name);
    // magic goes here
  });
};

