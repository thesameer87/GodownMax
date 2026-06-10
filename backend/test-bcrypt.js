const bcrypt = require('bcryptjs');
const hash = '$2a$10$.Z.j3VSkOZtHh0tyRxIIZuDI9YK0Z51t95Ni6nLIhKiVWTTinEhgO';
const password = 'Admin@123';
bcrypt.compare(password, hash).then(res => console.log("Match: " + res));
