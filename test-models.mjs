import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/models',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    try {
      const json = JSON.parse(data);
      console.log('✅ Valid JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('❌ Invalid JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
});

setTimeout(() => {
  req.end();
}, 500);
