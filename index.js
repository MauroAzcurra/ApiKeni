const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const downloaderRouter = require('./routes/downloader.js');

const app = express();
const PORT = process.env.PORT || 8080 || 5000 || 3000

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Disini Untuk Route Nya

app.use('/api/youtube', downloaderRouter);
app.use('/api/instagram', downloaderRouter);
app.use('/api/tiktok', downloaderRouter);
app.use('/api/facebook', downloaderRouter);
app.use('/api/twitter', downloaderRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port:${PORT}`);
});