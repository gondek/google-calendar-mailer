const readline = require('readline')
const googleAuth = require('google-auth-library')
const googleCalendar = require('googleapis').google.calendar('v3')
const moment = require('moment-timezone')
const nodemailer = require('nodemailer')

function isObject (o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

function safeJSONStringify (object) {
  try {
    return JSON.stringify(object)
  } catch (e) {
    return object + ''
  }
}

async function getAuthToken (apiCredentials) {
  let authUrl = apiCredentials.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  })
  console.log('The token in your taskfile is either missing or invalid')
  console.log('To use google-calendar-mailer, a new token will be generated')
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
        process.exit(0)
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
    if (!(s && s.clientId && s.clientSecret && s.redirectUri)) {
      throw new Error('Missing or malformed authentication data')
    }
    if (!(s.mailer && (typeof s.mailer.to === 'string') && (typeof s.mailer.from === 'string'))) {
      throw new Error('Missing "to" and "from" for settings.mailer')
    }
    if (typeof this.taskFileTasksFunction !== 'function') {
      throw new Error('The taskfile does not provide a "tasks" function')
    }
    this.apiCredentials = new googleAuth.OAuth2Client(s.clientId, s.clientSecret, s.redirectUri)
    this.apiCredentials.credentials = isObject(s.token) ? s.token : {}

    try {
      this.mailTransport = nodemailer.createTransport(s.mailer.transport)
    } catch (error) {
      throw new Error('settings.mailer.transport is an invalid nodemailer transport')
    }
  }

  async setUserTimezone () {
    return googleCalendar.settings.get({ auth: this.apiCredentials, setting: 'timezone' })
      .then(
        timezone => {
          try {
            this.userTimezone = timezone.data.value.slice(0) // call slice to ensure it's a string
            moment.tz.setDefault(timezone.data.value)
          } catch (unexpectedFormatError) {
            throw new Error('Unexpected timezone response from server: \n' + safeJSONStringify(timezone && timezone.data))
          }
        },
        apiError => {
          if (this.isCronMode) {
            throw new Error('Not authenticated (or other API access issue). Message from server: ' + apiError.message)
          }
          return getAuthToken(this.apiCredentials)
        }
      )
  }

  async runTasks () {
    const tasks = []
    const addTask = (task) => tasks.push(task)
    this.taskFileTasksFunction(addTask, moment, this.userTimezone)

    while (tasks.length > 0) {
      const task = tasks.shift()
      await this.runTask(task)
    }
  }

  async runTask (task) {
    task.parameters.auth = this.apiCredentials
    let events
    try {
      events = await googleCalendar.events.list(task.parameters)
    } catch (e) {
      throw new Error(`Task [${task.name}] failed: ${e}`)
    }

    if (!events || !events.data || !Array.isArray(events.data.items)) {
      throw new Error(`Task [${task.name}] failed: Unexpected server response for event information: \n` + safeJSONStringify(events && events.data))
    }

    if (typeof task.action !== 'function') {
      throw new Error(`Task [${task.name}] failed: "action" is not a function`)
    }

    const eventCount = events.data.items.length
    console.log(`Task [${task.name}]: Received ${eventCount} event` + (eventCount === 1 ? '' : 's'))

    let messages
    try {
      messages = task.action(events.data.items, task.name) || []
    } catch (e) {
      throw new Error(`Task [${task.name}] failed: "action" generated an error: ` + e)
    }
    if (!Array.isArray(messages)) {
      throw new Error(`Task [${task.name}] failed: "action" did not return an array of messages to send`)
    }

    return Promise.all(messages.map(message => {
      console.log(`Task [${task.name}]: Sending email '${message[0]}'`)
      return this.sendMail(message[0] || '', message[1] || '')
    }))
  }

  async sendMail (subject, body, tries) {
    const MAX_RETRIES = 3
    const mailTransport = this.mailTransport
    const from = this.taskFileSettings.mailer.from
    const to = this.taskFileSettings.mailer.to
    tries = tries || 0

    try {
      await mailTransport.sendMail({ from, to, subject, text: body })
    } catch (e) {
      if (tries > MAX_RETRIES) {
        throw new Error(`Failed sending email '${subject}': ${e}`)
      }
      await this.sendMail(subject, body, tries + 1)
    }
  }
}

module.exports = GoogleCalendarMailer
