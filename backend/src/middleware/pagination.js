function paginate(req, res, next) {
    req.pagination = {
        page: Math.max(1, parseInt(req.query.page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
    };
    req.pagination.offset = (req.pagination.page - 1) * req.pagination.limit;
    next();
}

module.exports = { paginate };