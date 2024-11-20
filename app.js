import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './src/config/db.js';
import { notFound, errorHandler } from './src/middleware/errMiddleware.js';

dotenv.config(); // Load environment variables from .env file

const app = express(); 

//import router 
import languageRoute from './src/routes/languageRoute.js';
import  userRoute from './src/routes/userRoute.js';

app.use(express.json()); 
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use('/api/language', languageRoute);
app.use('/api/user', userRoute);

app.use(notFound) 
app.use(errorHandler)


// Root route
app.get('/hi', (req, res) => {
  res.send('Hello, World!');
  console.log('Hello, World!');
});






// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB(); // Connect to your MongoDB database
    const PORT = process.env.PORT || 3005;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

startServer();



// {
//   "name": "Storytime",
//   "version": "1.0.0",
//   "main": "index.js",
//   "type": "module",
//   "scripts": {
//     "test": "echo \"Error: no test specified\" && exit 1",
//     "start": "node app.js",
//     "dev": "npx nodemon app.js"
//   },
//   "keywords": [],
//   "author": "",
//   "license": "ISC",
//   "description": "",
//   "dependencies": {
//     "bcrypt": "^5.1.1",
//     "cors": "^2.8.5",
//     "dotenv": "^16.4.5",
//     "ejs": "^3.1.10",
//     "express": "^4.21.1",
//     "express-async-handler": "^1.2.0",
//     "formidable": "^3.5.2",
//     "jsonwebtoken": "^9.0.2",
//     "mongoose": "^8.8.1",
//     "nodemailer": "^6.9.16",
//     "spotify-web-api-node": "^5.0.2",
//     "superagent": "^10.1.1"
//   },
//   "devDependencies": {
//     "nodemon": "^3.1.7"
//   }
// }
