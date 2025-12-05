const mongoose = require('mongoose');
mongoose.set('strictQuery',true);

async function ConnectionDB(url) {
    return mongoose.connect(url)
}

module.exports = {
    ConnectionDB,
}