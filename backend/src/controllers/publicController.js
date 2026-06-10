const Dog = require('../models/Dog');

exports.getDogsData = async (req, res, next) => {
    try {
        const dogs = await Dog.find({ status: 'available' })
            .select('-__v')
            .sort({ featured: -1, createdAt: -1 });

        res.json({ dogs });
    } catch (err) {
        next(err);
    }
};
