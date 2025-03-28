const bcrypt = require('bcrypt');
const { db } = require('../config/database');

const createSuperUser = async () => {
  try {
    console.log('Starting superuser creation...');
    
    const email = 'cekwedike';
    const password = 'Cheedii1206';
    const firstName = 'Chidiebere';
    const lastName = 'Ekwedike';
    
    console.log('Checking if user already exists...');
    const existingUser = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser) {
      console.log('User already exists, updating password...');
    }
    
    // Hash the password
    console.log('Hashing password...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert or update the superuser
    console.log('Creating/updating superuser...');
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $2,
          first_name = $3,
          last_name = $4,
          is_admin = true
      RETURNING id, email, first_name, last_name, is_admin
    `;
    
    const user = await db.one(query, [email, passwordHash, firstName, lastName]);

    console.log('Superuser created/updated successfully!');
    console.log('User details:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Name:', user.first_name, user.last_name);
    console.log('- Is Admin:', user.is_admin);
    console.log('\nYou can now log in with:');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Create user preferences if they don't exist
    console.log('Creating user preferences...');
    await db.none(`
      INSERT INTO user_preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `, [user.id]);
    
    console.log('Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating superuser:', error);
    process.exit(1);
  }
};

// Run the script
createSuperUser(); 