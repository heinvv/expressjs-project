const express = require('express');
const router = express.Router();
const Team = require('../models/team');

router.get('/', async (req, res) => {
    const teams = await Team.find();
    res.render( 'teams/index', { teams } );
});

router.post( '/', async ( req, res ) => {
    const team = new Team({
        name: req.body.name
    });

    try {
        const newTeam = await team.save();
        res.redirect( `/teams` );
    } catch ( err ) {
        res.render( 'teams/index', {
            team: team,
            errorMessage: 'Error creating team'
        } );
    }
});

// edit teams

// delete teams

module.exports = router;
