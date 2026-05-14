const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

function normalizePhone(phone) {
    phone = phone.trim();

    if (phone.startsWith('07')) {
        return '254' + phone.substring(1);
    }

    if (phone.startsWith('+254')) {
        return phone.replace('+', '');
    }

    return phone;
}

app.post('/bulk-stk', async (req, res) => {
    try {
        const { numbers, amount, reference } = req.body;

        if (!numbers || !amount || !reference) {
            return res.status(400).json({
                success: false,
                message: 'Missing fields'
            });
        }

        const phoneNumbers = numbers
            .split('\n')
            .map(num => normalizePhone(num))
            .filter(num => num.length > 0);

        const results = [];

        for (const phone of phoneNumbers) {
            try {
                const response = await axios.post(
                    'https://api.hashback.co.ke/initiatestk',
                    {
                        api_key: process.env.HASHBACK_API_KEY,
                        account_id: process.env.HASHBACK_ACCOUNT_ID,
                        amount: amount,
                        msisdn: phone,
                        reference: reference
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                results.push({
                    phone,
                    success: true,
                    response: response.data
                });

            } catch (error) {
                results.push({
                    phone,
                    success: false,
                    error: error.response?.data || error.message
                });
            }
        }

        res.json({
            success: true,
            total: results.length,
            results
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
