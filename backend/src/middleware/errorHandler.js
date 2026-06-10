const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: errors.join(', ') });
    }

    if (err.code === 11000) {
        return res.status(409).json({ error: 'Registro duplicado' });
    }

    res.status(err.status || 500).json({
        error: err.message || 'Erro interno do servidor'
    });
};

module.exports = errorHandler;
