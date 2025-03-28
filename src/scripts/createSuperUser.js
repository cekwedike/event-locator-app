const bcrypt = require('bcrypt');
const { db } = require('../config/database');

const createSuperUser = async () => {
  try {
    const email = 'cekwedike';
    const password = 'Cheedii1206';
    const firstName = 'Chidiebere';
    const lastName = 'Ekwedike';
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert the superuser
    await db.none(`
      INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $2,
          first_name = $3,
          last_name = $4,
          is_admin = true
    `, [email, passwordHash, firstName, lastName]);

    console.log('Superuser created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
  } catch (error) {
    console.error('Error creating superuser:', error);
    throw error;
  }
};

// Run the script
createSuperUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 