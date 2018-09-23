const readline = require('readline')
const googleAuth = require('google-auth-library')
const googleCalendar = require('googleapis').google.calendar('v3')
const moment = require('moment-timezone')
const nodemailer = require('nodemailer')

function isObject (o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}

function errorExitWithMessage (message) {
  if (arguments[1]) {
    console.error(arguments[1])
    console.error('\n')
  }
  console.error(`Error: ${message}\nSee README.md for help`)
  process.exit(1)
}

function createSendMailFunction (mailerOptions) {
  const MAX_RETRIES = 10
  let mailTransport

  try {
    mailTransport = nodemailer.createTransport(mailerOptions.transport)
  } catch (error) {
    errorExitWithMessage('Invalid nodemailer transport')
  }

  function sendMail (subject, text, attempt, resolve, reject) {
    if (attempt > MAX_RETRIES) {
      reject(new Error(`Failed sending email "${subject}"`))
    }

    mailTransport.sendMail({ from: mailerOptions.from, to: mailerOptions.to, subject, text }, function (error) {
      if (error) {
        return sendMail(subject, text, attempt + 1, resolve, reject)
      } else {
        let maxWidth = process.stdout.columns
        let s = `  - Sent "${subject}"`
        console.log(s.length > maxWidth ? `${s.substring(0, maxWidth - 4)}..."` : s)
        resolve()
      }
    })
  }

  return (subject, body) => {
    return new Promise((resolve, reject) => {
      sendMail(subject, body, 1, resolve, reject)
    })
  }
}

function runTasks (tasks, apiCredentials, sendMail) {
  function runTask (task) {
    task.parameters.auth = apiCredentials
    return new Promise((resolve, reject) => {
      googleCalendar.events.list(task.parameters, (error, events) => {
        if (error) {
          errorExitWithMessage(`Task "${task.name}" failed: ${error}`)
        }
        if (!events || !events.data || !Array.isArray(events.data.items)) {
          errorExitWithMessage(`Task "${task.name}" failed: Unexpected server response for event information (see above)`, events)
        }
        console.log(`Running task "${task.name}" (${events.data.items.length} events)`)
        Promise.all(events.data.items.map(e => sendMail(`[${task.name}] ${e.summary}`, e.description))).then(resolve).catch(reject)
      })
    })
  }

  function runNextTask () {
    if (tasks.length === 0) {
      return
    }
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

function initialize (options, actions, cronMode) {
  if (!(options && options.clientId && options.clientSecret && options.redirectUri && options.mailer)) {
    errorExitWithMessage('Missing or malformed authentication data')
  }

  let apiCredentials = new googleAuth.OAuth2Client(options.clientId, options.clientSecret, options.redirectUri)
  apiCredentials.credentials = isObject(options.token) ? options.token : {}

  googleCalendar.settings.get({ auth: apiCredentials, setting: 'timezone' }, (error, timezone) => {
    if (error) {
      if (cronMode) {
        errorExitWithMessage('Not authenticated')
      }
      getAuthToken(apiCredentials)
    } else {
      let tasks = []
      if (!timezone || !timezone.data || !timezone.data.value) {
        errorExitWithMessage('Unexpected server response for timezone information: ', timezone)
      }
      moment.tz.setDefault(timezone.data.value)
      actions((task) => tasks.push(task), moment, timezone.data.value)
      runTasks(tasks, apiCredentials, createSendMailFunction(options.mailer))
    }
  })
}

module.exports = {
  initialize,
  errorExitWithMessage
}
