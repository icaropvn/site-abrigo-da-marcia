const mongoose = require('mongoose');

const dogSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: ['Macho', 'Fêmea'],
        required: true
    },
    age: {
        type: String,
        required: true
    },
    size: {
        type: String,
        enum: ['Porte pequeno', 'Porte médio', 'Porte grande'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: String,
    formUrl: String,
    featured: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['available', 'adopted', 'pending'],
        default: 'available'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Dog', dogSchema);
