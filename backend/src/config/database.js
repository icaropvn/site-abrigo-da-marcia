const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/abrigo');
        console.log('MongoDB conectado');
    } catch (error) {
        console.error('Erro ao conectar MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
