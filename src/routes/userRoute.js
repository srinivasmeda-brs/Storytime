import express from 'express';
import { createUser, verifyEmail,loginUser,generateSpotifyToken,getUser,updatedUserProfile,
    updatePreferedLanguage,updatePassword,forgotPassword,resetPassword,saveSpotifyStory,
    removeSpotifyStory,getSpotifyStories
 } from "../controllers/userController.js";
import {checkToken} from "../middleware/authMiddleware.js"
const router = express.Router();

// Register user
router.post('/register', createUser);

// Verify email with the token passed in the URL
router.get('/verifyemail/:verifytoken', verifyEmail);
router.post('/login', loginUser);
router.get("/refreshToken",checkToken, generateSpotifyToken);
router.get('/profile', checkToken, getUser)
router.post('/profile', checkToken, updatedUserProfile);
router.post('/updatelanguage', checkToken, updatePreferedLanguage);
router.post('/updatepassword', checkToken, updatePassword); 
router.post('/forgotpassword', forgotPassword)
router.post('/resetpassword/:token', resetPassword)
router.post('/savestory', checkToken, saveSpotifyStory)
router.delete('/savestory',checkToken, removeSpotifyStory);
router.get('/library', checkToken,getSpotifyStories)




export default router;
