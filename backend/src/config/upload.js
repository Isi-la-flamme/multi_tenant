const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Dossier racine des uploads
const UPLOADS_ROOT = process.env.UPLOADS_PATH || '/app/uploads';

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(UPLOADS_ROOT)) {
    fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

// Storage configuré dynamiquement par tenant
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tenantId = req.tenant.id;
        const type = req.uploadType || 'general';
        const dir = path.join(UPLOADS_ROOT, `tenant_${tenantId}`, type);
        
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = uuidv4() + ext;
        cb(null, name);
    }
});

// Filtre par type de fichier
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        all: ['text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        general: ['text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
        image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        avatar: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    };
    
    const type = req.uploadType || 'all';
    const allowed = allowedTypes[type] || allowedTypes.all;
    
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé: ${file.mimetype}`), false);
    }
};

// Configuration multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: process.env.MAX_FILE_SIZE || 5 * 1024 * 1024, // 5MB par défaut
        files: 5
    }
});

module.exports = { upload, UPLOADS_ROOT };