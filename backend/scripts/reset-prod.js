const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const uri = process.env.MONGO_URI;

async function resetProductionPassword() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to Atlas Cluster');
    
    const db = client.db('test');
    const users = db.collection('users');

    const email = 'dhruvsingh200420@gmail.com';
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const result = await users.updateOne(
      { email: email.toLowerCase() },
      { 
        $set: { 
          password: hashedPassword,
          provider: 'local'
        } 
      }
    );

    if (result.matchedCount > 0) {
      console.log(`✅ SUCCESS: Updated password for ${email}`);
      console.log(`Modified count: ${result.modifiedCount}`);
    } else {
      console.log(`❌ FAILED: User ${email} not found in 'test' database.`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

resetProductionPassword();
