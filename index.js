const exec = require('child_process').exec
const assert = require('assert')
const path = require('path')

const smbc = exports

const LS_SEP = '      '

smbc.Client = class SMBC {
  constructor (server, options) {
    checkConstructorParams(server, options)
    this.server = server
    this.env = { DOMAIN: options.domain, USER: options.user, PASSWD: options.password }
  }

  async exists (path) {
    const env = this.env
    const cmd = buildCommand(this, { CMD: `ls '${path}'` })
    console.log(cmd)
    return new Promise((resolve, reject) => {
      exec(cmd, { env }, (err, stdout, stderr) => {
        if (err) return resolve(false)
        return resolve(true)
      })
    })
  }

  async readdir (path) {
    const env = this.env
    const cmd = buildCommand(this, { CMD: `ls`, DIR: path })
    console.log(cmd)
    return new Promise((resolve, reject) => {
      exec(cmd, { env }, (err, stdout, stderr) => {
        if (err) return reject(err)
        return resolve(
          stdout
            .split('\n')
            .filter(x => x.includes(LS_SEP))
            .map(x => x.split(LS_SEP)[0].trim())
            .filter(x => x !== '.' && x !== '..')
        )
      })
    })
  }

  async copyfile (remotePath, cwd = process.cwd()) {
    const env = this.env
    const filename = path.basename(remotePath)
    const dirname = path.dirname(remotePath)
    // const dirname = remotePath.substr(0, remotePath.length - filename.length - 1);
    const cmd = buildCommand(this, { CMD: `get ${filename}`, DIR: dirname })
    console.log(cmd)
    return new Promise((resolve, reject) => {
      exec(cmd, { cwd, env }, (err, stdout, stderr) => {
        if (err) return reject(err)
        return resolve(path.join(cwd, filename))
      })
    })
  }
}

function buildCommand (client, opt) {
  var cmd = ['smbclient', client.server]
  if (client.env.DOMAIN) cmd.push('-W', client.env.DOMAIN)
  if (opt.DIR) cmd.push('-D', `'${opt.DIR}'`)
  if (opt.CMD) cmd.push('-c', `'${opt.CMD}'`)
  return cmd.join(' ')
}

function checkConstructorParams (server = '', options) {
  assert(
    server.startsWith('//') || server.startsWith('\\\\'),
    "Not enough '\\' in server address. Must start with '//' or '\\\\'"
  )
  assert(
    !options.user || (typeof options.user === 'string' && typeof options.password === 'string'),
    'options.user and options.password must be string.'
  )
  assert(!options.domain || typeof options.domain === 'string', 'options.domain must be string.')
}
