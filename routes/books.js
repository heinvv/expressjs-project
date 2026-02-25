const express = require( 'express' );
const router = express.Router();
const multer = require( 'multer' );
const path = require( 'path' );
const fs = require( 'fs' );
const Author = require('../models/author');
const Book = require('../models/book');
const uploadPath = path.join( 'public', Book.converImageBasePath);
const imageMimeType = ['image/jpeg','image/gif','image/png'];
const upload = multer({
        dest: uploadPath,
        fileFilter: ( req, file, callback) => {
                callback(null, imageMimeType.includes(file.mimetype));
        }
});

router.get( '/', async( req, res ) => {
        let query = Book.find();

        if ( !! req?.query?.title ) {
            query = query.regex('title', new RegExp( req.query.title, 'i' ));
        }

        if ( !! req?.query?.publishBefore ) {
            query = query.lte('publishDate', req.query.publishBefore);
        }

        if ( !! req?.query?.publishAfter ) {
            query = query.gte('publishDate', req.query.publishAfter);
        }

        try {
                const books = await query.exec();

                res.render( 'books/index', { 
                        books: books,
                        searchOptions: req.query
                } );
        } catch {
                res.redirect( '/' );
        }
});

router.get( '/new', async ( req, res ) => {
        const authors = await Author.find();
        res.render( 'books/new', { 
                authors: authors,
                book: { title: '', author: '' }
        } );
});

router.post( '/', upload.single('coverImage'), async ( req, res ) => {

        const fileName = null != req.file ? req.file.filename : null;

        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            publishDate: req.body.publishDate,
            pageCount: req.body.pageCount,
            description: req.body.description,
            coverImageName: fileName,
        });

        try {
            const newBook = await book.save();
                // res.redirect( '/books/' + newBook.id );
            res.redirect( '/books' );
        } catch ( err ) {
                console.error( 'Book save error:', err );
                if ( !! book.coverImageName ) {
                        removeBookCover( book.coverImageName );
                }

                await renderNewPage( res, book, true );
        }
});

async function renderNewPage( res, book, hasError = false ) {
        try {
                const authors = await Author.find({});

                const parameters = {
                        book: book,
                        authors: authors,
                        errorMessage: hasError ? 'Error creating book' : null,
                }

                res.render( 'books/new', parameters );
        } catch {
                res.redirect( '/books' );
        }
}

function removeBookCover( fileName ) {
        fs.promises.unlink( path.join( uploadPath, fileName ), error => {
                if ( error ) {
                        console.error( error );
                }
        } );
}

module.exports = router;
