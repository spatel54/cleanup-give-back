const fs = require('fs');
const https = require('https');
const path = require('path');

const data = JSON.parse(fs.readFileSync('stitch_screens.json', 'utf8'));
const textContent = data.result.content[0].text;
const screensData = JSON.parse(textContent);

const outputDir = path.join(__dirname, 'stitch_htmls');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const promises = [];
  for (const screen of screensData.screens) {
    if (screen.htmlCode && screen.htmlCode.downloadUrl) {
      let safeTitle = screen.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      let dest = path.join(outputDir, `${safeTitle}.html`);
      promises.push(
        download(screen.htmlCode.downloadUrl, dest)
          .then(() => console.log(`Downloaded ${safeTitle}.html`))
          .catch(e => console.error(`Failed to download ${safeTitle}.html:`, e))
      );
    }
  }
  await Promise.all(promises);
  console.log("All downloads finished.");
}

main();
