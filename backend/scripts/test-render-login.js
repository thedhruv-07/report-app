const https = require('https');

function testRenderLogin() {
  const data = JSON.stringify({
    email: 'tempadmin@absoluteveritas.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'report-app-1.onrender.com',
    port: 443,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log(`Attempting login to https://${options.hostname}${options.path} with ${JSON.parse(data).email}...`);

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let responseData = '';
    res.on('data', (d) => {
      responseData += d;
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(responseData);
        console.log('Response:', JSON.stringify(json, null, 2));
        if (res.statusCode === 200) {
          console.log('✅ Login SUCCESSFUL via API!');
        } else {
          console.log('❌ Login FAILED via API.');
        }
      } catch (e) {
        console.log('Raw Response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error:', error);
  });

  req.write(data);
  req.end();
}

testRenderLogin();
