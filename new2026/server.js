if ( process.env.NODE_ENV !== 'production' ) {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const methodOverride = require('method-override');

const indexRouter = require('./routes/index');
const matchesRouter = require('./routes/matches');
const teamsRouter = require('./routes/teams');

app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');
app.use(expressLayouts);
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.use('/', indexRouter);
app.use('/matches', matchesRouter);
app.use('/teams', teamsRouter);

function encodeConnectionString(url) {
    try {
        const urlObj = new URL(url);

        if (urlObj.password) {
            urlObj.password = encodeURIComponent(urlObj.password);
            return urlObj.toString();
        }
        return url;
    } catch (error) {
        return url;
    }
}

function encodeConnectionString(url) {
    try {
        const urlObj = new URL(url);

        if (urlObj.password) {
            urlObj.password = encodeURIComponent(urlObj.password);
            return urlObj.toString();
        }
        return url;
    } catch (error) {
        return url;
    }
}

if (process.env.DATABASE_URL) {
    const connectionString = encodeConnectionString(process.env.DATABASE_URL);
    
    mongoose.connect(connectionString)
        .then(() => console.log('Connected to Database'))
        .catch((error) => {
            console.error('Database connection error:', error.message);
            console.error('Please check your DATABASE_URL configuration. Ensure special characters in the password are URL-encoded.');
        });

    const db = mongoose.connection;
    db.on('error', (error) => console.error('Database error:', error));
} else {
    console.warn('Warning: DATABASE_URL not set. Database features will be unavailable.');
}

app.listen(process.env.PORT || 3001);
