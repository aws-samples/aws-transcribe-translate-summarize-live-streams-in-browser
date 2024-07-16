const fs = require("fs");
const path = require('path')
const glob = require("tiny-glob");
const manifest = require("../public/manifest.json");
const config = require("../src/config.js");

const { api_gateway_id: apiGatewayId, aws_project_region: region } = config.module

async function getFileNames(pattern) {
  const files = await glob(`build/static${pattern}`)
  
  return files.map(file => path.posix.relative('build', file.split(path.sep).join(path.posix.sep)));
}

async function main() {
  const js = await getFileNames('/js/**/*.js')
  const css = await getFileNames('/css/**/*.css')

  const newManifest = {
    ...manifest,
    content_scripts: [
      {
        ...manifest.content_scripts[0],
        js,
        css,
      },
    ],
    web_accessible_resources: [
      {
        ...manifest.web_accessible_resources[0],
        resources: [...css],
      },
    ],
    host_permissions: [
      `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/`
    ],
  };

  console.log('WRITING', path.resolve("./build/manifest.json"))
  fs.writeFileSync(
    path.resolve("./build/manifest.json"),
    JSON.stringify(newManifest, null, 2),
    'utf8'
  );
}

main();
