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
};

// const isWin = process.platform === "win32";

// const removeFolder = async (directoryPath) => {
//   if (isWin) {
//     await runCommand("rmdir", ["/s/q/f", directoryPath]);
//   } else {
//     await runCommand("rm", ["-rf", directoryPath]);
//   }
// };

const removeFolder = (directoryPath) =>
  fs.rmdirSync(directoryPath, { recursive: true, force: true });

const removeFile = (filePath) => fs.unlinkSync(filePath);
const renameFile = (from, to) => fs.renameSync(from, to);

(async () => {
  const repositoryUrl = "https://github.com/afreet-co/admin-dashboard-ts.git";
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
  await removeFolder(`${directoryName}/.git`);
  await removeFolder(`${directoryName}/.github`);
  //1. Removing the readme, package-lock.json
  removeFile(`${directoryName}/README.md`);
  removeFile(`${directoryName}/package-lock.json`);
  //2. rename .env.example to .env
  renameFile(`${directoryName}/.env.example`, `${directoryName}/.env.local`);

  //3. get the json from package.json
  const packageJsonRaw = fs.readFileSync(
    path.join(process.cwd(), directoryName, "package.json")
  );
  const packageJson = JSON.parse(packageJsonRaw);
  // and modify its detail
  packageJson.name = directoryName;
  packageJson.author = "";
  packageJson.keywords = [];
  packageJson.version = "1.0.0";
  packageJson.description =
    "An Admin dashboard built on next.js with tailwindCSS.";
  // and again write it again into package.json
  removeFile(`${directoryName}/package.json`);
  fs.writeFileSync(
    `${directoryName}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );
  // Installing the dependencies.
  console.log("Now, installing the dependencies...");
  await runCommand("npm", ["i"], {
    cwd: path.join(process.cwd(), directoryName),
  });

  console.log(`Application generated is ready to use.
To get started, 
- cd ${directoryName}
- npm run dev
  `);
})();
