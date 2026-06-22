const fs = require('fs');
const path = require('path');

function updatePackageJson(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`[SKIP] ${filePath} not found.`);
        return;
    }

    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        const pkg = JSON.parse(rawData);

        if (!pkg.dependencies) {
            pkg.dependencies = {};
        }

        pkg.dependencies['@teamgosh/bee-sdk'] = 'file:public/bee-sdk';

        fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(`[SUCCESS] Injected @teamgosh/bee-sdk into ${filePath}`);
    } catch (e) {
        console.error(`[ERROR] Failed to update ${filePath}:`, e.message);
    }
}

console.log('--- Watchtower Batch 87 Dependency Patcher ---');

// Target the root package.json
updatePackageJson(path.join(__dirname, 'package.json'));

console.log('\nBatch file modifications complete. Run `npm install` to finalize the dependency tree mapping.');
