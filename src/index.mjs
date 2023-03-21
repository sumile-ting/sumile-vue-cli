// src/index.mjs
let globby = await import('globby')
let commander = await import('commander')
let path = await import('path')
let pacote = await import('pacote')
let chalk = await import('chalk')
const files = await import('fs-extra')

const ora = await import('ora')

const fs = files.default

import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
// 获取 __filename 的 ESM 写法
const __filename = fileURLToPath(import.meta.url)
// 获取 __dirname 的 ESM 写法
const __dirname = dirname(fileURLToPath(import.meta.url))


const { program } = commander

let commandsPath = []
let pkgVersion = ''
let pkgName = ''

// 获取src/command路径下的命令
const getCommand = () => {
  
  commandsPath =
  globby.globbySync('./commands/*.*s', { cwd: __dirname, deep: 1 }) || []
  return commandsPath
}

// 获取当前包的信息
const getPkgInfo = () => {
  const jsonPath = path.join(__dirname, '../package.json')
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
  const jsonResult = JSON.parse(jsonContent)
  pkgVersion = jsonResult.version
  pkgName =  jsonResult.name
}

// 获取最新包最新版本
const getLatestVersion = async () => {
  try {
    const manifest = await pacote.default.manifest(`${pkgName}@latest`)
    return manifest.version
  } catch(e) {
    console.error('error:', e)
    return '1.0.0'
  }
    
    
}

async function start() {
  getPkgInfo()
  const commandsPath = getCommand()
  program.version(pkgVersion)

  for(let i=0; i< commandsPath.length; i++) {
    const commandPath = commandsPath[i]
    const commandObj = await import(`./${commandPath}`)
    const { command, description, optionList, action } = commandObj.default
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
    console.log(`未知命令 command ${chalk.default.yellow(cmd)}.`)
    const latestVersion = await getLatestVersion() 
    if(latestVersion !== pkgVersion){
      console.log(`可更新版本，${chalk.default.green(pkgVersion)} -> ${chalk.default.green(latestVersion)}`)
    }
    process.exitCode = 1
  })

  program.parseAsync(process.argv)
}

start()
