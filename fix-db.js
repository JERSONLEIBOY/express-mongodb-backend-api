const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/ele_admin').then(async () => {
  await mongoose.connection.collection('dictionaries').dropIndexes();
  await mongoose.connection.collection('dictionaryitems').dropIndexes();
  console.log('清理完成');
  process.exit(0);
});
