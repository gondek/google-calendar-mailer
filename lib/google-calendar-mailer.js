const readline = require('readline')
const googleAuth = require('google-auth-library')
const googleCalendar = require('googleapis').google.calendar('v3')
const moment = require('moment-timezone')
const nodemailer = require('nodemailer')

function isObject (o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

// create a function that sends emails with two parameters: (subject, body)
function createSendMailFunction (mailerOptions) {
  const MAX_RETRIES = 10
  let mailTransport

  try {
    mailTransport = nodemailer.createTransport(mailerOptions.transport)
  } catch (error) {
    throw new Error('Invalid nodemailer transport')
  }

  function sendMail (subject, text, attempt, resolve, reject) {
    if (attempt > MAX_RETRIES) {
      reject(new Error(`Failed sending email "${subject}"`))
    }

    mailTransport.sendMail({ from: mailerOptions.from, to: mailerOptions.to, subject, text }, function (error) {
      if (error) {
        return sendMail(subject, text, attempt + 1, resolve, reject)
      }
      resolve()
    })
  }

  return (subject, body) => {
    return new Promise((resolve, reject) => {
      sendMail(subject, body, 1, resolve, reject)
    })
  }
}

async function getAuthToken (apiCredentials) {
  let authUrl = apiCredentials.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  })
  console.log('A token must be generated before being able to run google-calendar-mailer')
  console.log(`First, visit the following page:\n\n${authUrl}\n`)
  let rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve, reject) => {
    rl.question('and enter the code from that page here: ', function (code) {
      rl.close()
      apiCredentials.getToken(code, function (error, token) {
        if (error) {
          return reject(new Error(`Unable to generatate token: ${error}`))
        }
        console.log(`\nPlease enter this token in your taskfile and restart:\n${JSON.stringify(token, null, 2)}`)
        resolve()
      })
    })
  })
}

class GoogleCalendarMailer {
  constructor (taskFileSettings, taskFileTasksFunction, isCronMode) {
    this.taskFileSettings = taskFileSettings
    this.taskFileTasksFunction = taskFileTasksFunction
    this.isCronMode = isCronMode
  }

  // this method should be called before invoking any other methods
  initialize () {
    const s = this.taskFileSettings
    if (!(s && s.clientId && s.clientSecret && s.redirectUri && s.mailer)) {
      throw new Error('Missing or malformed authentication data')
    }
    if (typeof this.taskFileTasksFunction !== 'function') {
      throw new Error('The taskfile does not expose a "tasks" function')
    }
    this.apiCredentials = new googleAuth.OAuth2Client(s.clientId, s.clientSecret, s.redirectUri)
    this.apiCredentials.credentials = isObject(s.token) ? s.token : {}
  }

  async setUserTimezone () {
    return googleCalendar.settings.get({ auth: this.apiCredentials, setting: 'timezone' })
      .then(
        timezone => {
          try {
            this.userTimezone = timezone.data.value
            moment.tz.setDefault(timezone.data.value)
          } catch (keyMissingError) {
            throw new Error('Unexpected timezone response from server: \n' + JSON.stringify(timezone))
          }
        },
        apiError => {
          if (this.isCronMode) {
            throw new Error('Not authenticated (or other API access issue. Message from server: ' + apiError.message)
          }
          return getAuthToken(this.apiCredentials)
        }
      )
  }

  async runTasks () {
    const tasks = []
    const addTask = (task) => tasks.push(task)
    const mailer = createSendMailFunction(this.taskFileSettings.mailer)
    this.taskFileTasksFunction(addTask, moment, this.userTimezone)

    while (tasks.length > 0) {
      const task = tasks.shift()
      await this.runTask(task, mailer)
    }
  }

  async runTask (task, mailer) {
    task.parameters.auth = this.apiCredentials
    let events
    try {
      events = await googleCalendar.events.list(task.parameters)
    } catch (e) {
      throw new Error(`Task [${task.name}] failed: ${e}`)
    }

    if (!events || !events.data || !Array.isArray(events.data.items)) {
      throw new Error(`Task [${task.name}] failed: Unexpected server response for event information: \n` + JSON.stringify(events))
    }

    if (typeof task.action !== 'function') {
      throw new Error(`Task [${task.name}] failed: "action" is not a function`)
    }

    const eventCount = events.data.items.length
    console.log(`Task [${task.name}]: Received ${eventCount} event` + (eventCount === 1 ? '' : 's'))

    let messages = task.action(events.data.items, task.name) || []
    if (!Array.isArray(messages)) {
      throw new Error(`Task [${task.name}] failed: "action" did not return an array of messages to send`)
    }

    return Promise.all(messages.map(message => {
      console.log(`Task [${task.name}]: Sending email '${message[0]}'`)
      mailer(message[0] || '', message[1] || '')
    }))
  }
}

module.exports = GoogleCalendarMailer
