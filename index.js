const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Mount scrapers
app.use('/chat', require('./scrapers/v1'));
app.use('/chat', require('./scrapers/v2'));
app.use('/chat', require('./scrapers/v3'));
app.use('/chat', require('./scrapers/v4'));
app.use('/chat', require('./scrapers/v5'));
app.use('/chat', require('./scrapers/v6'));
app.use('/chat', require('./scrapers/v7'));
app.use('/chat', require('./scrapers/v8'));
app.use('/chat', require('./scrapers/v9'));
app.use('/chat', require('./scrapers/v10'));
app.use('/chat', require('./scrapers/v11'));
app.use('/chat', require('./scrapers/v12'));
app.use('/chat', require('./scrapers/v13'));
app.use('/chat', require('./scrapers/postel'));
app.use('/chat', require('./scrapers/typliai'));
app.use('/chat', require('./scrapers/heckai'));


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
