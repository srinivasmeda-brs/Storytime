import Category from '../models/categoryModel.js';

export const getCategories = async (req, res) => {
  try {
    // Fetch all categories from the database
    const categories = await Category.find({});
    // Return the categories as JSON response with status 200 (OK)
    res.status(200).json(categories);
  } catch (error) {
    console.error(error); // Log error if something goes wrong
    res.status(500).json({ message: 'Error retrieving categories', error: error.message });
  }
};
