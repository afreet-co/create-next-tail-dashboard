#! /usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const runCommand = (command, args, options = undefined) => {
  const spawned = spawn(command, args, options);
  return new Promise((resolve) => {
    spawned.stdout.on("data", (data) => {
      console.log(String.toString(data));
    });
    spawned.stderr.on("data", (data) => {
      console.error(data.toString());
    });
    spawned.on("close", () => {
      resolve();
    });
  });
}
var isWin = process.platform === "win32";

const removeFolder = async (directoryPath) => {
  if (isWin) {
    await runCommand("rmdir", ["/s/q", directoryPath]);
  }
  else {
    await runCommand("rm", ["-rf", directoryPath]);
  }
}
const removeFile = async (filePath) => {

  if (isWin) {
    await runCommand("del", ["/f", filePath]);
  }
  else {
    await runCommand("rm", ["-r", filePath]);
  }
}
const renameFile = async (from, to) => {
  if (isWin) {
    await runCommand("Ren", [from, to]);
  }
  else {
    await runCommand("mv", [from, to]);
  }
}

(async () => {
  const repositoryUrl = "https://github.com/afreet-co/admin-dashboard-ts.git"
  //Get the name of the app-directory to make
  const directoryName = process.argv[2];
  if (!directoryName || directoryName.match(/[<>:"\/\\|?*\x00-\x1F]/)) {
    return console.log(`
        Invalid directory name.
        Usage : 'create-next-tail-dashboard name_of_app'
        `);
  }
  // Clone the repository into the given name
  await runCommand("git", ["clone", repositoryUrl, directoryName]);
  // Removing the .git folder
  if (process.platform === 'win32') {

  } else {
    await removeFolder(`${directoryName}/.git`);
    await removeFolder(`${directoryName}/.github`);
    //1. Removing the readme, package-lock.json
    await removeFile(`${directoryName}/README.md`);
    await removeFile(`${directoryName}/package-lock.json`);
    //2. rename .env.example to .env
    await renameFile(
      `${directoryName}/.env.example`,
      `${directoryName}/.env.local`,
    )

  }

  //3. get the json from package.json
  const packageJsonRaw = fs.readFileSync(path.join(process.cwd(), directoryName, 'package.json'));
  const packageJson = JSON.parse(packageJsonRaw);
  // and modify its detail
  packageJson.name = directoryName;
  packageJson.author = "";
  packageJson.keywords = [];
  packageJson.version = "1.0.0";
  packageJson.description = "An Admin dashboard built on next.js with tailwindCSS.";
  // and again write it again into package.json
  await removeFile(`${directoryName}/package.json`);
  fs.writeFileSync(
    `${directoryName}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );
  // Installing the dependencies.
  console.log("Now, installing the dependencies...");
  await runCommand("npm", ["i"], { cwd: path.join(process.cwd(), directoryName) });

  console.log(`Application generated is ready to use.
To get started, 
- cd ${directoryName}
- npm run dev
  `);
})();

