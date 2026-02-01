const express = require( 'express' );
const router = express.Router();
const Book = require('../models/book');

router.get( '/', async( req, res ) => {
        res.send( 'Books index' );
});

router.get( '/new', ( req, res ) => {
        res.send( 'Books new' );
});

router.post( '/', async ( req, res ) => {
        res.send( 'Books create' );
});

module.exports = router;
