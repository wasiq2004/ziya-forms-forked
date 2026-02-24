const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('Setting up MySQL database...');
  console.log('Using MySQL configuration:');
  console.log('- Host:', process.env.MYSQL_HOST || 'localhost');
  console.log('- Port:', process.env.MYSQL_PORT || '3306');
  console.log('- User:', process.env.MYSQL_USER || 'root');
  console.log('- Database:', process.env.MYSQL_DATABASE || 'ziya_forms');
  console.log('- Password provided:', !!process.env.MYSQL_PASSWORD);
  
  // Create connection without specifying database
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
  });
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'lib', 'mysql', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim() !== '') {
        console.log('Executing:', statement.substring(0, 50) + '...');
        // Use execute without prepared statements for unsupported commands
        await connection.query(statement);
      }
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await connection.end();
  }
}

setupDatabase();