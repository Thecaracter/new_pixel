import http from 'http';

// Test /api/health endpoint
function testHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ health: true, status: res.statusCode, data: json });
        } catch (e) {
          reject(new Error(`Invalid JSON: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

// Test /api/models endpoint
function testModels() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: '/api/models',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.models || !Array.isArray(json.models)) {
            throw new Error('models field missing or not an array');
          }
          resolve({ models: true, status: res.statusCode, data: json });
        } catch (e) {
          reject(new Error(`Invalid response: ${e.message}, got: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running smoke tests...\n');
  
  try {
    console.log('Testing /api/health...');
    const healthResult = await testHealth();
    console.log(`✅ /api/health: ${JSON.stringify(healthResult.data)}\n`);
  } catch (err) {
    console.log(`❌ /api/health failed: ${err.message}\n`);
  }

  try {
    console.log('Testing /api/models...');
    const modelsResult = await testModels();
    console.log(`✅ /api/models returned ${modelsResult.data.models.length} models:`);
    console.log(`   ${JSON.stringify(modelsResult.data)}\n`);
  } catch (err) {
    console.log(`❌ /api/models failed: ${err.message}\n`);
  }

  process.exit(0);
}

// Wait a moment for server to start, then run tests
setTimeout(runTests, 1500);
