const { uploadMetadataSchema } = require('./src/validators/upload-validator');

// Test 1: general
const result1 = uploadMetadataSchema.validate({ entityType: 'general' });
console.log('Test 1 (general):', result1.error || '✅ OK');

// Test 2: product avec UUID
const result2 = uploadMetadataSchema.validate({ 
    entityType: 'product', 
    entityId: '123e4567-e89b-12d3-a456-426614174000' 
});
console.log('Test 2 (product with UUID):', result2.error || '✅ OK');

// Test 3: product sans UUID
const result3 = uploadMetadataSchema.validate({ entityType: 'product' });
console.log('Test 3 (product sans UUID):', result3.error ? '❌ ' + result3.error.message : '✅ OK');

// Test 4: type invalide
const result4 = uploadMetadataSchema.validate({ entityType: 'invalid' });
console.log('Test 4 (type invalide):', result4.error ? '❌ ' + result4.error.message : '✅ OK');