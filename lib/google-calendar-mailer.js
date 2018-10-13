const readline = require('readline')
const googleAuth = require('google-auth-library')
const googleCalendar = require('googleapis').google.calendar('v3')
const moment = require('moment-timezone')
const nodemailer = require('nodemailer')

function isObject (o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

// create a function that sends emails with two parameters: (subject, body)
export function createSendMailFunction (mailerOptions) {
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

    // TODO
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

export class GoogleCalendarMailer {
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
            throw new Error('Not authenticated (or other API access issue): ' + apiError.message)
          }
          this.getAuthToken()
        }
      )
  }

  async runTasks () {
    const tasks = []
    const addTask = (task) => tasks.push(task)
    const mailer = createSendMailFunction(this.taskFileSettings.mailer)
    this.taskFileTasksFunction(addTask, mailer, moment, this.userTimezone)

    while (tasks.length > 0) {
      const task = tasks.shift()
      await runTask(task)
    }
  }

  async runTask (task) {
    task.parameters.auth = this.apiCredentials
    let events
    try {
       events = await googleCalendar.events.list(task.parameters)
    } catch (e) {
      throw new Error(`Task "${task.name}" failed: ${error}`)
    }

    if (!events || !events.data || !Array.isArray(events.data.items)) {
      throw new Error(`Task "${task.name}" failed: Unexpected server response for event information: \n` + JSON.stringify(events))
    }

    if (typeof task.actions !== 'function') {
      throw new Error(`Task "${task.name}" failed: "actions" is not a function`)
    }

    console.log(`Running task "${task.name}" (${events.data.items.length} events)`)
    task.action(events)
    // TODO
    //         let maxWidth = process.stdout.columns
            // let s = `  - Sent "${subject}"`
            // console.log(s.length > maxWidth ? `${s.substring(0, maxWidth - 4)}..."` : s)
  }
}

function runTasks (tasks, apiCredentials) {
  function runTask (task) {
    return new Promise((resolve, reject) => {
      googleCalendar.events.list(task.parameters, (error, events) => {
        console.log(`Running task "${task.name}" (${events.data.items.length} events)`)
        Promise.all(events.data.items.map(e => sendMail(`[${task.name}] ${e.summary}`, e.description))).then(resolve).catch(reject)
      })
    })
  }

  function runNextTask () {
    if (tasks.length === 0) {

    runTask(tasks.shift()).then(runNextTask).catch((error) => errorExitWithMessage(`Failed running task: ${error.message}`))
  }

  tasks.forEach(task => {
    if (!(isObject(task) && typeof task.name === 'string' && isObject(task.parameters))) {
      errorExitWithMessage(`Task "${task.name}" is invalid`)
    }
  })

  runNextTask()
}

function getAuthToken (apiCredentials) {
  let authUrl = apiCredentials.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  })
  console.log('A token must be generated before being able to run google-calendar-mailer')
  console.log(`First, visit the following page:\n\n${authUrl}\n`)
  let rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.question('and enter the code from that page here: ', function (code) {
    rl.close()
    apiCredentials.getToken(code, function (error, token) {
      if (error) {
        errorExitWithMessage(`Unable to generatate token: ${error}`)
      }
      console.log(`\nPlease enter this token in your taskFile and restart:\n${JSON.stringify(token, null, 2)}`)
    })
  })
}
