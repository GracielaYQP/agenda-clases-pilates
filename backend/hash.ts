import * as bcrypt from 'bcrypt';

async function hashPass() {
  const hashed = await bcrypt.hash('Lcarsofi123#', 15);
  console.log('Hash:', hashed);
}

hashPass();

