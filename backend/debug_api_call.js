const axios = require('axios');
require('dotenv').config({ path: './.env' });

const fs = require('fs');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('debug_output.txt', msg + '\n');
};

const run = async () => {
    fs.writeFileSync('debug_output.txt', ''); // Clear file
    try {
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'abinaya123@gmail.com',
            password: '123456'
        });

        const token = loginRes.data.token;
        log("Login successful. Token obtained.");

        try {
            const res = await axios.get('http://localhost:5000/api/students/assignments/all', {
                headers: { Authorization: `Bearer ${token} ` }
            });
            log(`Assignments Response: ${res.status} ${res.data.length} assignments`);
        } catch (e) {
            log(`Assignments Error: ${e.response ? e.response.status : e.message} `);
        }

        try {
            const res2 = await axios.get('http://localhost:5000/api/students/notifications', {
                headers: { Authorization: `Bearer ${token} ` }
            });
            log(`Notifications Response: ${res2.status} `);
        } catch (e) {
            log(`Notifications Error: ${e.response ? e.response.status : e.message} `);
        }

    } catch (err) {
        log(`Login failed: ${err.response ? err.response.data.message : err.message} `);
    }
};
run();
