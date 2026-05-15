```javascript
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

/**
 * Normalize Kenyan phone numbers
 */
function normalizePhone(phone) {
    phone = phone.trim();

    if (!phone) return null;

    // 07XXXXXXXX
    if (phone.startsWith('07') && phone.length === 10) {
        return '254' + phone.substring(1);
    }

    // 01XXXXXXXX
    if (phone.startsWith('01') && phone.length === 10) {
        return '254' + phone.substring(1);
    }

    // +2547XXXXXXXX
    if (phone.startsWith('+254')) {
        return phone.replace('+', '');
    }

    // 2547XXXXXXXX
    if (phone.startsWith('254') && phone.length >= 12) {
        return phone;
    }

    return null;
}

/**
 * Delay helper
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.post('/bulk-stk', async (req, res) => {

    try {

        const { numbers, amount, reference } = req.body;

        if (!numbers || !amount || !reference) {
            return res.status(400).json({
                success: false,
                message: 'Numbers, amount and reference are required'
            });
        }

        const phoneNumbers = numbers
            .split('\n')
            .map(num => normalizePhone(num))
            .filter(Boolean);

        if (phoneNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid phone numbers found'
            });
        }

        const results = [];

        for (const phone of phoneNumbers) {

            try {

                console.log(`Sending STK to ${phone}`);

                const payload = {
                    api_key: process.env.HASHBACK_API_KEY,
                    account_id: process.env.HASHBACK_ACCOUNT_ID,
                    amount,
                    msisdn: phone,
                    reference
                };

                const response = await axios.post(
                    'https://api.hashback.co.ke/initiatestk',
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                );

                results.push({
                    phone,
                    success: true,
                    data: response.data
                });

                console.log(`STK sent successfully to ${phone}`);

            } catch (error) {

                console.log(`Failed sending STK to ${phone}`);

                results.push({
                    phone,
                    success: false,
                    error:
                        error.response?.data ||
                        error.message ||
                        'Unknown error'
                });
            }

            /**
             * 2000ms delay between requests
             */
            console.log('Waiting 2 seconds before next request...');
            await delay(2000);
        }

        return res.json({
            success: true,
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * Health check route
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK'
    });
});

/**
 * Frontend route
 */
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```
