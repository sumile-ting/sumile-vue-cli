// src/index.js
const globby = require('globby')
const program = require('commander')
const path = require('path')
const pacote = require('pacote')
const chalk = require('chalk')
const files = require('fs-extra')

let commandsPath = []
let pkgVersion = ''
let pkgName = ''

// 获取src/command路径下的命令
const getCommand = () => {
  commandsPath =
  globby.sync('./commands/*.*s', { cwd: __dirname, deep: 1 }) || []
  return commandsPath
}

// 获取当前包的信息
const getPkgInfo = () => {
  const jsonPath = path.join(__dirname, '../package.json')
  const jsonContent = files.readFileSync(jsonPath, 'utf-8')
  const jsonResult = JSON.parse(jsonContent)
  pkgVersion = jsonResult.version
  pkgName = jsonResult.name
}

// 获取最新包最新版本
const getLatestVersion = async () => {
  try {
    const manifest = await pacote.manifest(`${pkgName}@latest`)
    return manifest.version
  } catch (e) {
    console.error('error:', e)
    return '1.0.0'
  }
}

async function start () {
  getPkgInfo()
  const commandsPath = getCommand()
  program.version(pkgVersion)

  for (let i = 0; i < commandsPath.length; i++) {
    const commandPath = commandsPath[i]
    const commandObj = require(`./${commandPath}`)
    const { command, description, optionList, action } = commandObj
    const curp = program
      .command(command)
      .description(description)
      .action(action)

    optionList &&
      optionList.map((option) => {
        curp.option(...option)
      })
  }

  program.on('command:*', async ([cmd]) => {
    program.outputHelp()
    console.log(`未知命令 command ${chalk.yellow(cmd)}.`)
    const latestVersion = await getLatestVersion()
    if (latestVersion !== pkgVersion) {
      console.log(`可更新版本，${chalk.green(pkgVersion)} -> ${chalk.green(latestVersion)}`)
    }
    process.exitCode = 1
  })

  program.parseAsync(process.argv)
}

start()
