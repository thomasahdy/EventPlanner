db = db.getSiblingDB('admin');
db.createUser({
  user: 'admin',
  pwd: 'password',
  roles: [
    {
      role: 'readWrite',
      db: 'eventplanner'
    },
    {
      role: 'dbAdmin',
      db: 'eventplanner'
    }
  ]
});

db = db.getSiblingDB('eventplanner');
db.createCollection('Users');
db.createCollection('Events');