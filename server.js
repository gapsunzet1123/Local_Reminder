// server.js (เวอร์ชันอัปเดต)
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

const AUTO_SAVE_FOLDER = 'auto';
const FILE_NAME = 'knowledge-base-data.json';
const FOLDER_PATH = path.join(__dirname, AUTO_SAVE_FOLDER);
const DB_PATH = path.join(FOLDER_PATH, FILE_NAME);

if (!fs.existsSync(FOLDER_PATH)) {
    fs.mkdirSync(FOLDER_PATH);
    console.log(`Created directory: ${FOLDER_PATH}`);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Endpoint สำหรับดึงข้อมูล (อัปเดตให้รองรับโครงสร้างใหม่)
app.get('/load', (req, res) => {
    fs.readFile(DB_PATH, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // ถ้าไม่มีไฟล์เลย ให้ส่งโครงสร้างข้อมูลเริ่มต้นกลับไป
                return res.json({ articles: [], quickLinks: [] });
            }
            return res.status(500).send('Error reading data file.');
        }
        try {
            const parsedData = JSON.parse(data);
            // ตรวจสอบว่าเป็นโครงสร้างเก่า (array) หรือโครงสร้างใหม่ (object)
            if (Array.isArray(parsedData)) {
                // ถ้าเป็นโครงสร้างเก่า ให้แปลงเป็นโครงสร้างใหม่
                res.json({ articles: parsedData, quickLinks: [] });
            } else {
                // ถ้าเป็นโครงสร้างใหม่ ก็ส่งไปได้เลย
                res.json(parsedData);
            }
        } catch (parseErr) {
            res.status(500).send('Error parsing data file.');
        }
    });
});

// Endpoint สำหรับบันทึกข้อมูล
app.post('/save', (req, res) => {
    const dataToSave = req.body; // ควรจะเป็น object { articles: [...], quickLinks: [...] }
    fs.writeFile(DB_PATH, JSON.stringify(dataToSave, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).send('Error writing data file.');
        }
        res.send('Data saved successfully.');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop.');
});
