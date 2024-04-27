import express from 'express';
import puppeteer from 'puppeteer';
import path, { parse } from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 8080;


const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.use(express.json());

app.listen(port, () => {
  console.log('server is running at port number 8080')
});


app.get('/', (req, res) => {

  let date = new Date();

  console.log("incoming GET request at : " + date);
  console.log(req.body);

  if (isAnyValueNull(req.body) === true) {
    //res.status(400).send("Please check the formatting of your request - there are null values");
  } else {
    launch(req, res);
  }

});

app.post('/', (req, res) => {

  let date = new Date();

  console.log("incoming POST request at : " + date);
  console.log(req.body);

  if (isAnyValueNull(req.body) === true) {
    //res.status(400).send("Please check the formatting of your request - there are null or empty values in your request body");
  } else {
    launch(req, res);
  }

});

function isAnyValueNull(jsonObject) {
  for (let key in jsonObject) {
    if (jsonObject[key] === null || jsonObject[key] === "") {
      return true; // If any value is null, return true
    }
  }
  return false; // If no null values found, return false
}


function launch(req, res) {
  // puppeteer
  (async (req) => {

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();

    const client = await page.createCDPSession()
    await client.send('Page.setDownloadBehavior', {
      behavior: 'allow', downloadPath: path.resolve(__dirname)
    });


    // Navigate the page to a URL

    await page.goto(`http://localhost:3000/index.html`);

    await page.evaluate((lat, lng, zoom, key, sse, texSize) => {

      
      window.localStorage.setItem('req_lat', lat);
      window.localStorage.setItem('req_lng', lng);
      window.localStorage.setItem('req_zoom', zoom);
      window.localStorage.setItem('req_key', key);
      window.localStorage.setItem('req_sse', sse);
      window.localStorage.setItem('req_texSize', texSize);
      

    }, req.body.lat, req.body.lng, req.body.zoom, req.body.key, req.body.sse, req.body.texSize);

    await page.goto(`http://localhost:3000/index.html`, { waitUntil: 'networkidle0' });



    // Set screen size
    await page.setViewport({ width: 1920, height: 1080 });

    await browser.close();

    res.sendFile(
      path.join(__dirname, "./combined_3d_tiles.gltf")
    );

  })(req);

} 