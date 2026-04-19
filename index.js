const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Mount scrapers
app.use('/chat/v1', require('./scrapers/v1'));
app.use('/chat/v2', require('./scrapers/v2'));
app.use('/chat/v3', require('./scrapers/v3'));
app.use('/chat/v4', require('./scrapers/v4'));
app.use('/chat/v5', require('./scrapers/v5'));
app.use('/chat/v6', require('./scrapers/v6'));
app.use('/chat/v7', require('./scrapers/v7'));
app.use('/chat/v8', require('./scrapers/v8'));
app.use('/chat/v9', require('./scrapers/v9'));
app.use('/chat/v10', require('./scrapers/v10'));
app.use('/chat/v11', require('./scrapers/v11'));
app.use('/chat/v12', require('./scrapers/v12'));
app.use('/chat/v13', require('./scrapers/v13'));
app.use('/chat/postel', require('./scrapers/postel'));
app.use('/chat/typliai', require('./scrapers/typliai'));
app.use('/chat/heckai', require('./scrapers/heckai'));


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
