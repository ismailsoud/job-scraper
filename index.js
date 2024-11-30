const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { startScraping } = require('./scraper');

const app = express();
const port = 3000;
startScraping()

let jsonData
// Read the JSON file

app.use(cors()); // Enable CORS for all routes

app.get('/api/data', (req, res) => {
  fs.readFile('./data/data.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return;
    }
  
    try {
      // Parse the JSON data
      jsonData = JSON.parse(data);
      
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
    }
  });
  res.json(jsonData);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});