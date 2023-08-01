// src/commands/create.jsexecaCommandSync
const download = require('download-git-repo')
const fs = require('fs-extra')
const chalk = require('chalk')
const inquirer = require('inquirer')
const handlebars = require('handlebars')
const path = require('path')

const cwd = process.cwd()

// 检查是否已经存在相同名字工程
const checkProjectExist = async (targetDir) => {
  if (fs.existsSync(targetDir)) {
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'checkExist',
      message: `\n仓库路径${targetDir}已存在，请选择`,
      choices: ['覆盖', '取消']
    })
    if (answer.checkExist === '覆盖') {
      console.log(chalk.yellow(`删除${targetDir}...`))
      fs.removeSync(targetDir)
    } else {
      return true
    }
  }
  return false
}

const action = async (projectName, cmdArgs) => {
  const targetDir = path.join(
    (cmdArgs && cmdArgs.context) || cwd,
    projectName
  )
  if ((await checkProjectExist(targetDir))) {
    return
  }
  const ora = await import('ora')
  const spinner = ora.default('正在下载中').start()
  download('https://github.com:sumile-ting/vue3-admin#feature-cli', targetDir, { clone: true }, err => {
    if (err) {
      spinner.fail(chalk.red('下载失败！'))
      return
    }
    spinner.succeed(chalk.yellow('模板下载成功'))
    inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '请输入项目名称'
      },
      {
        type: 'input',
        name: 'description',
        message: '请输入项目简介'
      },
      {
        type: 'input',
        name: 'author',
        message: '请输入作者姓名'
      }
    ]).then(async (answers) => {
      const packagePath = `${targetDir}/package.json`
      const packageContent = fs.readFileSync(packagePath, 'utf-8')
      // 使用handlebars解析模板引擎
      const packageResult = handlebars.compile(packageContent)(answers)
      // 将解析后的结果重写到package.json文件中
      fs.writeFileSync(packagePath, packageResult)
      console.log(chalk.yellow('初始化模板成功'))

      const execa = await import('execa')
      // 新建工程装包
      execa.execaCommandSync('npm install', {
        stdio: 'inherit',
        cwd: targetDir
      })

      spinner.succeed(
        `项目创建完成 ${chalk.yellow(projectName)}\n👉 输入以下命令启动项目:`
      )

      console.log(chalk.yellow(`$ cd ${projectName}\n$ npm run dev\n`))
    })
  })
}
module.exports = {
  command: 'create <project-name>',
  description: '创建一个基于https://github.com/sumile-ting/vue3-admin.git的项目模板',
  optionList: [['--context <context>', '上下文路径']],
  action
}
