import Language from '../models/languageModel.js';

export const getLanguage = async (req, res, next) => {
    try {
        const languages = await Language.find({}); // Fetch all languages
        res.status(200).json(languages); // Send the languages as JSON response
    } catch (err) {
        // In case of error, send a 500 status and error message
        res.status(500).json({ message: err.message });
    }
};
