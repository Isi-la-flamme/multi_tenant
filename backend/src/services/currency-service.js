class CurrencyService {
    formatXOF(amount) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatPrice(amount) {
        return `${new Intl.NumberFormat('fr-FR').format(Math.round(amount))} FCFA`;
    }

    round(amount) {
        return Math.round(amount);
    }

    isValidAmount(amount) {
        return typeof amount === 'number' && amount >= 0 && !isNaN(amount);
    }

    toInteger(amount) {
        return Math.round(amount);
    }
}

module.exports = new CurrencyService();