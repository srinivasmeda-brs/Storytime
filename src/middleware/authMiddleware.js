import jwt from 'jsonwebtoken' 
import User from '../models/userModel.js' 
import expressAsyncHandler from 'express-async-handler'


const checkToken = expressAsyncHandler(async (req, res, next) => {
    let token;
    const authorizationHeader = req.headers.authorization;

    if (authorizationHeader && authorizationHeader.startsWith('Bearer')) {
        // Extract the token from the Authorization header
        token = authorizationHeader.split(' ')[1];

        try {
            // Verify the token
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

            // Optionally attach the decoded token to the request object for further use
            req.user = await User.findById(decodedToken.userId)

            // Proceed to the next middleware or route handler
            next();
        } catch (e) {
            console.error('Token verification error:', e);
            res.status(401).json({ message: 'Invalid token' });
        }
    } else {
        // Return a 401 Unauthorized response if no valid token is provided
        res.status(401).json({ message: 'Not authorized, token is required' });
    }
});

export {checkToken}