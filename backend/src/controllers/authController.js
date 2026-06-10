const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha obrigatórios' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const isValidPassword = await admin.comparePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET || 'sua-chave-secreta',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            admin: { id: admin._id, email: admin.email, name: admin.name }
        });
    } catch (err) {
        next(err);
    }
};

exports.me = async (req, res, next) => {
    try {
        const admin = await Admin.findById(req.admin.id).select('-password');
        if (!admin) return res.status(404).json({ error: 'Admin não encontrado' });
        res.json(admin);
    } catch (err) {
        next(err);
    }
};
