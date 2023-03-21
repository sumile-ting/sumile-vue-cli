// src/commands/create.js
const download = await import('download-git-repo')
const ora = await import('ora')
const fs = await import('fs-extra')
const chalk = await import('chalk')
const inquirer = await import('inquirer')
const handlebars = await import('handlebars')
let path = await import('path')
const cwd = process.cwd()

// 检查是否已经存在相同名字工程
export const checkProjectExist = async (targetDir) => {
  if (fs.default.existsSync(targetDir)) {
    const answer = await inquirer.default.prompt({
      type: 'list',
      name: 'checkExist',
      message: `\n仓库路径${targetDir}已存在，请选择`,
      choices: ['覆盖', '取消'],
    })
    if (answer.checkExist === '覆盖') {
      console.log(chalk.default.yellow(`删除${targetDir}...`))
      fs.default.removeSync(targetDir)
    } else {
      return true
    }
  }
  return false
}

const action = async (projectName, cmdArgs) => { 
  const targetDir = path.default.join(
    (cmdArgs && cmdArgs.context) || cwd,
    projectName
  )
  if ((await checkProjectExist(targetDir))) {
    return
  }
 const spinner = ora.default('正在下载中').start()
 download.default("https://github.com:sumile-ting/vue3-admin#feature-cli", targetDir, {clone: true}, err => {
    if(err){
      spinner.fail(chalk.default.red('下载失败！'))
      return 
    }
    spinner.succeed(chalk.default.yellow('模板下载成功'))
    inquirer.default.prompt([
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
      },
  ]).then((answers) => {
      const packagePath = `${targetDir}/package.json`
      const packageContent = fs.default.readFileSync(packagePath,'utf-8')
      //使用handlebars解析模板引擎
      const packageResult = handlebars.default.compile(packageContent)(answers)
      //将解析后的结果重写到package.json文件中
      fs.default.writeFileSync(packagePath,packageResult)
      console.log(chalk.default.yellow('初始化模板成功'))
      
    })
  })
}
export default {
    command: 'create <project-name>',
    description: '创建一个基于https://github.com/sumile-ting/vue3-admin.git的项目模板',
    optionList: [['--context <context>', '上下文路径']],
    action
}
