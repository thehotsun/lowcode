//update-version.js

const path = require('path');
const fs = require('fs');
const { version } = require('os');
let newVersion = process.argv[2]?.replace(/^v/, ''); // 获取命令行参数中的新版本号,并过滤v字头

if (!newVersion) {
  console.log(
    '请确定传入新版本号命令行参数且遵循semver规范 .eg: 1.0.0, 1.0.1, 1.1.0，否则自动更新小版本号'
  );
  // process.exit(1);
}

// 获取当前命令行上下文路径

const currentDirectory = process.cwd();

// 获取 package.json 文件中的版本号
const packageJsonPath = path.join(currentDirectory, 'package.json');
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
const packageJson = JSON.parse(packageJsonContent);
const currentVersion = packageJson.version;

// 更新 package.json 文件中的版本号

if (!newVersion) {
  const versionArr = packageJson.version.split('.');
  versionArr[2] = versionArr[2] * 1 + 1;
  newVersion = versionArr.join('.');
}
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log(`版本号已从 ${currentVersion} 更新为 ${newVersion}`);
