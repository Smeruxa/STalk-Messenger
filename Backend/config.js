const { Pool } = require('pg')

const pool = new Pool({
    user: '',
    host: '',
    database: '',
    password: '',
    port: 0000
})

const SECRET = ''

module.exports = { 
    pool, SECRET, 
    UPLOAD_DIR: '',
    UPLOAD_URL_PATH: '/stalk/uploads_avatars',
    __dirname 
}