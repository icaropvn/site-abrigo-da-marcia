function validateDog(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!['Macho', 'Fêmea'].includes(data.gender)) {
        errors.push('Gênero deve ser Macho ou Fêmea');
    }

    if (!data.age || data.age.trim().length < 1) {
        errors.push('Idade é obrigatória');
    }

    if (!['Porte pequeno', 'Porte médio', 'Porte grande'].includes(data.size)) {
        errors.push('Tamanho deve ser Porte pequeno, Porte médio ou Porte grande');
    }

    if (!data.description || data.description.trim().length < 10) {
        errors.push('Descrição deve ter pelo menos 10 caracteres');
    }

    return errors;
}

module.exports = { validateDog };
