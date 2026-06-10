const Dog = require('../models/Dog');
const { validateDog } = require('../utils/validators');

exports.getAll = async (req, res, next) => {
    try {
        const dogs = await Dog.find({ status: 'available' })
            .sort({ featured: -1, createdAt: -1 });
        res.json(dogs);
    } catch (err) {
        next(err);
    }
};

exports.getAllAdmin = async (req, res, next) => {
    try {
        const dogs = await Dog.find().sort({ createdAt: -1 });
        res.json(dogs);
    } catch (err) {
        next(err);
    }
};

exports.getOne = async (req, res, next) => {
    try {
        const dog = await Dog.findOne({ id: req.params.id });
        if (!dog) return res.status(404).json({ error: 'Cão não encontrado' });
        res.json(dog);
    } catch (err) {
        next(err);
    }
};

exports.create = async (req, res, next) => {
    try {
        const errors = validateDog(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        const { name, gender, age, size, description, formUrl, featured } = req.body;

        const dog = new Dog({
            id: name.toLowerCase()
                .normalize('NFD').replace(/[̀-ͯ]/g, '')
                .replace(/\s+/g, '-'),
            name,
            gender,
            age,
            size,
            description,
            formUrl,
            featured: featured === 'true' || featured === true,
            image: req.file ? '/uploads/' + req.file.filename : null
        });

        await dog.save();
        res.status(201).json(dog);
    } catch (err) {
        next(err);
    }
};

exports.update = async (req, res, next) => {
    try {
        const errors = validateDog(req.body);
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        const { name, gender, age, size, description, formUrl, featured, status } = req.body;

        const updateData = {
            name, gender, age, size, description, formUrl,
            featured: featured === 'true' || featured === true,
            status: status || 'available'
        };

        if (req.file) {
            updateData.image = '/uploads/' + req.file.filename;
        }

        const dog = await Dog.findOneAndUpdate(
            { id: req.params.id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!dog) return res.status(404).json({ error: 'Cão não encontrado' });
        res.json(dog);
    } catch (err) {
        next(err);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const dog = await Dog.findOneAndDelete({ id: req.params.id });
        if (!dog) return res.status(404).json({ error: 'Cão não encontrado' });
        res.json({ message: 'Cão removido com sucesso' });
    } catch (err) {
        next(err);
    }
};
