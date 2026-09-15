const fs = require('fs');

const data = JSON.parse(fs.readFileSync('stitch_screens.json', 'utf8'));
const textContent = data.result.content[0].text;
const screensData = JSON.parse(textContent);

console.log("Total screens:", screensData.screens.length);
screensData.screens.forEach(screen => {
  console.log("Name:", screen.name);
  console.log("Title:", screen.title);
  if (screen.htmlCode && screen.htmlCode.downloadUrl) {
    console.log("Has HTML: Yes");
  } else {
    console.log("Has HTML: No");
  }
  console.log("---");
});
