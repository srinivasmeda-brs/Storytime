import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { sendMailVerificationLink,sendPasswordResetLink } from '../utils/utils.js';
import SpotifyWebApi from 'spotify-web-api-node';

const createUser = async (req, res, next) => {
    const { first_name, last_name, email, password } = req.body; 
    console.log(process.env.MONGO_URI)

    try {
        // Validate input fields
        if (!first_name || !last_name || !email || !password) {
            const err = new Error('All fields are required');
            err.statusCode = 400;
            return next(err);
        }

        // Check for valid email format
        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(email)) {
            const err = new Error('Invalid email format');
            err.statusCode = 400;
            return next(err);
        }

        // Check password validation
        if (password.length < 8) {
            const err = new Error('Password must be at least 8 characters long');
            err.statusCode = 400;
            return next(err);
        }

        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const err = new Error('Email already exists');
            err.statusCode = 400;
            return next(err);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate token
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "2h" });

        // Create user and save to DB
        const user = await User.create({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            verify_token: token,
            verify_token_expires: Date.now() + 60000
        });

        // Send verification email
        const verificationResponse = await sendMailVerificationLink(email, token, first_name);
        if (verificationResponse.error) {
            throw new Error('Failed to send verification email');
        }

        // Send success response
        res.status(201).json({ message: 'User created successfully. Please check your email to verify your account', token });
        
    } catch (err) {
        next(err); // Pass error to the error handler
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        // Find user by verification token
        const user = await User.findOne({ verify_token: req.params.verifyToken });

        if (!user) {
            return res.status(404).send("Invalid token");
        }

        // Check if the token has expired
        if (user.verify_token_expires <= Date.now()) {
            if (!user.verified) {
                // If verification has expired, delete the user
                await user.deleteOne();  // Remove user if verification expired
                return res.status(409).send('Verification link is expired. Please register again.');
            }
        } else if (user.verified) {
            // If user is already verified
            return res.status(200).send('Email is already verified. Please login.');
        } else {
            // Otherwise, verify the user's email
            user.verified = true;
            await user.save();  // Save the user with updated verification status
            return res.status(201).send('Email is verified successfully. You can now login.');
        }
    } catch (err) {
        next(err);  // Pass error to the error handler
    }
};


const loginUser = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('User not found');
            err.statusCode = 404;
            return next(err);
        }

        // Check if user is verified
        if (!user.verified) {
            const err = new Error('Your account verification is pending. Please verify your email to continue.');
            err.statusCode = 409;
            return next(err);
        }

        // Check if password matches
        const passwordMatched = await bcrypt.compare(password, user.password);
        if (!passwordMatched) {
            const err = new Error('Invalid password');
            err.statusCode = 401;
            return next(err);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' } // 30 days token expiration
        );
        user.token = token;
        await user.save();

        // Generate Spotify token
        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_SECRET_KEY, 
        });

        let spotifyToken;
        try {
            const spotifyCredentials = await spotifyApi.clientCredentialsGrant();
            spotifyToken = spotifyCredentials.body;
        } catch (err) {
            return res.status(500).json({ message: 'Failed to fetch Spotify token', error: err.message });
        }

        // Response with tokens and expiry
        const expiresIn = 2592000; // 30 days in seconds
        res.status(200).json({ 
            message: 'Login successful',
            token, 
            spotifyToken, 
            expiresIn 
        });
    } catch (err) {
        next(err);
    }
};


const generateSpotifyToken = async (req, res, next) => {
    try {
        // Initialize Spotify API client
        const spotifyApi = new SpotifyWebApi({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_SECRET_KEY,
        });

        // Fetch Spotify token using client credentials flow
        const spotifyCredentials = await spotifyApi.clientCredentialsGrant();
        const spotifyToken = spotifyCredentials.body;

        // Send the token as a response
        res.status(200).json({ spotifyToken: spotifyToken });
    } catch (err) {
        // Handle errors
        console.error('Error fetching Spotify token:', err);
        res.status(500).json({
            message: 'Failed to fetch Spotify token',
            error: err.message,
        });
    }
};


const getUser = async (req, res,next) => {
    const user = await User.findById(req.user._id);
    if (user){
        const profileData = {
            _id:user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            languages:user.languages
        }
        res.status(200).json(profileData);
    }else{
        res.status(404).json({ message: 'User not found' }); 
        return next(err);
    }

}  

const updatedUserProfile = async (req, res, next) => {
    const { first_name, last_name, email } = req.body;
    
    try {
        // Find user by ID
        const user = await User.findById(req.user._id);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            return next(err);
        }

        // Update first_name and last_name if provided
        if (first_name || last_name) {
            user.first_name = first_name || user.first_name;
            user.last_name = last_name || user.last_name;
        }

        // Check for email conflicts and update email
        if (email && email !== user.email) {
            const userExists = await User.findOne({ email });
            if (userExists) {
                const err = new Error('Email already exists');
                err.status = 400;
                return next(err);
            }
            user.email = email;
        }

        // Save updated user
        await user.save();
        res.status(200).json({ message: 'Profile updated successfully' });

    } catch (err) {
        next(err); // Pass the error to the error-handling middleware
    }
};

const updatePreferedLanguage = async (req, res, next) => {
    const { language } = req.body;

    try {
        // Find user by ID
        const user = await User.findById(req.user._id);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            return next(err);
        }

        // Validate `language`
        if (!language) {
            const err = new Error('Language is required');
            err.status = 400;
            return next(err);
        }

        // Update the preferred language
        user.languages = language;
        await user.save();

        res.status(200).json({ message: 'Language updated successfully' });
    } catch (err) {
        next(err); // Pass the error to the error-handling middleware
    }
};

const updatePassword = async (req, res, next) => {
    const { password } = req.body;

    // Validate password presence
    if (!password) {
        const err = new Error('Password is required');
        err.status = 400;
        return next(err);
    }

    try {
        // Find user by ID
        const user = await User.findById(req.user._id);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            return next(err);
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        // Save the user
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        next(err); // Pass the error to the error-handling middleware
    }
};


const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    // Validate email input
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id, email }, process.env.JWT_SECRET, {
            expiresIn: '2h',
        });

        // Save token and expiry in the database
        user.reset_password_token = token;
        user.reset_password_expires = Date.now() + 7200000; // 2 hours in milliseconds
        await user.save();

        // Send password reset email
        const verificationEmailResponse = await sendPasswordResetLink(email, token, user.first_name);

        // Handle email sending error
        if (verificationEmailResponse.error) {
            const err = new Error('Failed to send password reset link. Please try again.');
            err.status = 500;
            return next(err);
        }

        // Send success response
        res.status(200).json({ message: 'Password reset link sent successfully. Please check your email.' });

    } catch (err) {
        // Pass the error to the error-handling middleware
        next(err);
    }
};


const resetPassword = async (req, res, next) => {
    const { token } = req.params; // Token from URL params
    const { password } = req.body; // Password from request body

    // Validate input
    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }

    try {
        // Find user by token and ensure token is still valid
        const user = await User.findOne({
            reset_password_token: token,
            reset_password_expires: { $gt: Date.now() }, // Check token expiry
        });

        if (!user) {
            const err = new Error('Token expired or invalid. Please generate a new one.');
            err.status = 401;
            return next(err);
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;

        // Clear reset token and expiry
        user.reset_password_token = null;
        user.reset_password_expires = null;

        // Save updated user data
        await user.save();

        // Respond with success
        res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        // Pass errors to error-handling middleware
        next(err);
    }
};

const saveSpotifyStory = async (req, res, next) => {
    const { storyId } = req.body;

    // Validate the storyId input
    if (!storyId) {
        return res.status(400).json({ message: 'Story ID is required' });
    }

    try {
        // Find the user by ID
        const user = await User.findById(req.user._id);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            return next(err);
        }

        // Check if the story is already saved
        if (user.saved_stories.includes(storyId)) {
            return res.status(400).json({ message: 'Story is already saved' });
        }

        // Save the story ID to the user's saved stories
        user.saved_stories.push(storyId);
        await user.save();

        // Respond with success
        res.status(200).json({ message: 'Story saved successfully' });
    } catch (err) {
        // Handle errors and pass to middleware
        next(err);
    }
};

const removeSpotifyStory = async (req, res, next) => {
    const { storyId } = req.body;
    
    // Validate if storyId is provided
    if (!storyId) {
        return res.status(400).json({ message: 'Story ID is required' });
    }

    try {
        // Find the user by ID
        const user = await User.findById(req.user._id);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            return next(err);
        }

        // Check if the story is saved
        const index = user.saved_stories.indexOf(storyId);
        if (index === -1) {
            return res.status(400).json({ message: 'Story is not saved' });
        }

        // Remove the story from saved stories
        user.saved_stories.splice(index, 1);
        await user.save();

        // Respond with success
        res.status(200).json({ message: 'Story removed successfully' });
    } catch (err) {
        // Pass errors to the error-handling middleware
        next(err);
    }
};


const getSpotifyStories = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id); 
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Access the saved stories for the user
        const stories = user.saved_stories; 

        // Return the stories
        return res.status(200).json({ stories }); 

    } catch (err) { 
        next(err); // Pass the error to the error-handling middleware
    }
};


export { createUser, verifyEmail,loginUser,generateSpotifyToken,getUser,updatedUserProfile,
    updatePreferedLanguage,updatePassword,forgotPassword,resetPassword,saveSpotifyStory,
    removeSpotifyStory,getSpotifyStories}
