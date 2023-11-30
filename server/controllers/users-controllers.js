const { v4: uuidv4 } = require('uuid');
const {validationResult}=require('express-validator')

const HttpError=require('../models/Http-error')
const User = require('../models/user');


const SOME_USERS=[
  {
    id:'u1',
    name:'Haythem NASFI',
    email:'test@test.com',
    password:'testes'

  }
]
const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, 'password');
    } catch (err) {
        const error = new HttpError('Fetching users failed, please try again', 500);
        return next(error);
    }
    res.json({ users: users.map((user) => user.toObject({ getters: true })) });
}

const signUp = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data', 422));
    }

    const { name, email, password } = req.body;

    try {
        // Use findOne on the User model
        const existingUser = await User.findOne({ email: email });

        if (existingUser) {
            return next(new HttpError('User already exists, try a new one', 422));
        }

        // Create a new user instance
        const createdUser = new User({
            name,
            email,
            image: 'https://i.pinimg.com/1200x/64/81/22/6481225432795d8cdf48f0f85800cf66.jpg',
            password,
            places:[]
        });

        // Save the user to the database
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Signing up failed, try again', 500);
        return next(error);
    }
    res.json({ message: 'signed up in successfully' });
};



const logIn = async (req, res, next) => {
    const { email, password } = req.body;
    let existingUser;
    try {
         existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError('Logging in failed, please try again', 500);
        return next(error);
    }

    if (!existingUser || existingUser.password !== password) {
        const error = new HttpError('Invalid credentials', 401);
        return next(error);
    }

    res.json({ message: 'Logged in successfully' });
}


exports.getUsers=getUsers;
exports.signUp=signUp;
exports.logIn=logIn