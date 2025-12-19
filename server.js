if ( process.env.NODE_ENV !== 'production' ) {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');

const indexRouter = require('./routes/index');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.set('layout', __dirname + '/layouts/layout');
app.use(expressLayouts);
app.use(express.static('public'));

const mongoose = require('mongoose');

if (process.env.DATABASE_URL) {
    mongoose.connect(process.env.DATABASE_URL)
        .then(() => console.log('Connected to Database'))
        .catch((error) => {
            console.error('Database connection error:', error);
            process.exit(1);
        });

    const db = mongoose.connection;
    db.on('error', (error) => console.error('Database error:', error));
} else {
    console.warn('Warning: DATABASE_URL not set. Database features will be unavailable.');
}

app.use('/', indexRouter);

app.listen(process.env.PORT || 3000);

