const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const HttpError = require('../models/Http-error');
const Place = require('../models/place');
const User = require('../models/user');
const getCoordsForAddress = require('../util/location');

let SOME_PLACES = [
    {
        id: 'p1',
        title: 'OLIMPICO',
        description: 'AS Roma Stadium, one of the best Atmospheres in the world',
        location: {
            lat: 41.9342,
            lng: 12.4544,
            image: 'https://media.asroma.com/prod/images/gm_preview/5060125b3c22-stadio-olimpico-roma.jpg'
        },
        address: "Viale dei Gladiatori, 2, 00135 Roma RM, Italy",
        creator: 'u1'
    }
];

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid;
    console.log('Looking for place with ID:', placeId);

    try {
        const place = await Place.findById(placeId);

        if (!place) {
            console.log('Place not found');
            const error = new HttpError('Could not find a place for the provided ID', 404);
            return next(error);
        }

        console.log('Found place:', place);
        res.json({ place: place.toObject({ getters: true }) });
    } catch (err) {
        console.error('Error while finding place:', err);
        const error = new HttpError('Internal server error', 500);
        return next(error);
    }
};

const getPlaceByUserId = async (req, res, next) => {
    const userId = req.params.uid;
    let userWithPlaces;
    try {
        userWithPlaces = await User.findById(userId).populate('places');
    } catch (err) {
        const error = new HttpError('fetching places failed', 500);
        return next(error);
    }
    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        return res.status(404).json({ message: 'No places found for the provided user ID' });
    }

    res.json({ places: userWithPlaces.places.map((place) => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        throw new HttpError('Invalid inputs passed, please check your data', 422);
    }

    const { title, description, address, creator } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    let user;

    const createdPlace = new Place({
        title,
        description,
        location: {
            lat: coordinates.lat,
            lng: coordinates.lng,
        },
        address,
        image: 'https://example.com/default-image.jpg',
        creator,
    });

    try {
        await createdPlace.save();
        user = await User.findById(creator);
    } catch (err) {
        const error = new HttpError('Creating place failed', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Cannot find the User at this provided Id', 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (err) {
        await sess.abortTransaction();
        console.error(err);
        const error = new HttpError('Something went wrong, could not delete place', 500);
        return next(error);
    }

    res.status(201).json({ place: createdPlace });
};

const updatePlaceById = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new HttpError('Invalid inputs passed, please check', 422);
    }
    const { title, description } = req.body;
    const placeId = req.params.pid;
    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
        console.log('Fetched place:', place);

        if (!place) {
            const error = new HttpError('Place not found', 404);
            return next(error);
        }

        if (!place.creator) {
            const error = new HttpError('Creator not found for the place', 500);
            return next(error);
        }

        console.log('Before deletion:', place.creator.places);
        await place.remove();
        console.log('After deletion:', place.creator.places);
        place.creator.places.pull(place);
        await place.creator.save();

        res.status(200).json({ message: 'Deleted place.' });
    } catch (err) {
        console.error(err);
        const error = new HttpError('Something went wrong, could not delete place', 500);
        return next(error);
    }

    place.title = title;
    place.description = description;
    try {
        await place.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update place', 500);
        return next(error);
    }
    res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlaceById = async (req, res, next) => {
    const placeId = req.params.pid;

    try {
        const place = await Place.findById(placeId).populate('creator');
        console.log('Fetched place:', place);

        if (!place) {
            const error = new HttpError('Place not found', 404);
            return next(error);
        }

        if (!place.creator) {
            const error = new HttpError('Creator not found for the place', 500);
            return next(error);
        }

        console.log('Before deletion - creator.places:', place.creator.places);

        const sess = await mongoose.startSession();
        sess.startTransaction();

        try {
            await Place.deleteOne({ _id: placeId }, { session: sess });
            console.log('After deletion - creator.places:', place.creator.places);

            place.creator.places.pull(place);
            await place.creator.save({ session: sess });

            await sess.commitTransaction();
        } catch (err) {
            console.error('Error during deletion:', err);
            await sess.abortTransaction();
            throw err;
        } finally {
            sess.endSession();
        }

        res.status(200).json({ message: 'Deleted place.' });
    } catch (err) {
        console.error('Error during deletePlaceById:', err);
        const error = new HttpError('Something went wrong, could not delete place', 500);
        return next(error);
    }
};

exports.getPlaceById = getPlaceById;
exports.getPlaceByUserId = getPlaceByUserId;
exports.createPlace = createPlace;
exports.updatePlaceById = updatePlaceById;
exports.deletePlaceById = deletePlaceById;
