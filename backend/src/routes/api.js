const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        status: 'success',
        tenant: req.tenant?.subdomain
    });
});

module.exports = router;