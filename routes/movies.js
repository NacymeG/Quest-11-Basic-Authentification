const express = require('express');
const app = express();
const moviesRouter = require('express').Router();
const Movie = require('../models/movie');
const cookieParser = require('cookie-parser');
const Helpers = require('../helpers/users');

moviesRouter.get('/', async (req, res) => {
  const { max_duration, color } = req.query;
  if (req.headers.cookie) {
    const token = await req.headers.cookie.split('=')[1];
    const decodedToken = await Helpers.decode(token);
    const queryShowMovies = await Movie.findMovieByUserID(decodedToken.user_id);
    return await res.status(201).json(queryShowMovies);
  }
  Movie.findMany({ filters: { max_duration, color } })
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error retrieving movies from database');
    });
});

moviesRouter.get('/:id', (req, res) => {
  Movie.findOne(req.params.id)
    .then((movie) => {
      if (movie) {
        res.json(movie);
      } else {
        res.status(404).send('Movie not found');
      }
    })
    .catch((err) => {
      res.status(500).send('Error retrieving movie from database');
    });
});

app.use(cookieParser());

moviesRouter.post('/', async (req, res) => {
  if (req.headers.cookie) {
    const token = await req.headers.cookie.split('=')[1];
    const decodedToken = await Helpers.decode(token);
    req.body.user_id = decodedToken.user_id;
  } else return res.send('you are not logged');

  const error = await Movie.validate(req.body);
  if (error) {
    res.status(422).json({ validationErrors: error.details });
  } else {
    const MovieCreated = await Movie.create(req.body);
    res.status(201).json(MovieCreated);
  }
});

moviesRouter.put('/:id', (req, res) => {
  let existingMovie = null;
  let validationErrors = null;
  Movie.findOne(req.params.id)
    .then((movie) => {
      existingMovie = movie;
      if (!existingMovie) return Promise.reject('RECORD_NOT_FOUND');
      validationErrors = Movie.validate(req.body, false);
      if (validationErrors) return Promise.reject('INVALID_DATA');
      return Movie.update(req.params.id, req.body);
    })
    .then(() => {
      res.status(200).json({ ...existingMovie, ...req.body });
    })
    .catch((err) => {
      console.error(err);
      if (err === 'RECORD_NOT_FOUND')
        res.status(404).send(`Movie with id ${req.params.id} not found.`);
      else if (err === 'INVALID_DATA')
        res.status(422).json({ validationErrors: validationErrors.details });
      else res.status(500).send('Error updating a movie.');
    });
});

moviesRouter.delete('/:id', (req, res) => {
  Movie.destroy(req.params.id)
    .then((deleted) => {
      if (deleted) res.status(200).send('🎉 Movie deleted!');
      else res.status(404).send('Movie not found');
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error deleting a movie');
    });
});

module.exports = moviesRouter;
