const express = require('express');
const router = express.Router();
const Team = require('../models/team');

router.get('/', async (req, res) => {
    const teams = await Team.findAll();
    res.render('teams/index', { teams });
});

router.post('/', async (req, res) => {
    try {
        const newTeam = await Team.create({ name: req.body.name });
        res.redirect('/teams');
    } catch (err) {
        res.render('teams/index', {
            errorMessage: 'Error creating team',
        });
    }
});

// edit teams

// delete teams

module.exports = router;
