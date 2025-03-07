const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Update the static file serving
app.use(express.static('public'));
app.use('/public', express.static('public'));
app.use(express.json());

// Add a specific route to get positions
app.get('/public/positions.json', (req, res) => {
    const positionsPath = path.join(__dirname, 'public', 'positions.json');
    try {
        const positions = fs.readFileSync(positionsPath, 'utf8');
        res.json(JSON.parse(positions));
    } catch (error) {
        console.error('Error reading positions:', error);
        res.status(500).json({ error: 'Failed to read positions' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Add this new route
app.get('/position-editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'position-editor.html'));
});

// API endpoint to save positions
app.post('/save-positions', (req, res) => {
    const positions = req.body;
    const filePath = path.join(__dirname, 'public', 'positions.json');
    
    try {
        // Debug logging
        console.log('Received positions:', positions);
        
        // Check if positions object is valid
        if (!positions || typeof positions !== 'object') {
            console.log('Invalid positions object');
            throw new Error('Invalid positions data');
        }
        
        // Validate required fields
        const requiredFields = ['marketName', 'imei', 'invoiceNo'];
        for (const field of requiredFields) {
            if (!positions[field] || typeof positions[field].x !== 'number' || typeof positions[field].y !== 'number') {
                console.log(`Invalid field: ${field}`, positions[field]);
                throw new Error(`Invalid position data for ${field}`);
            }
        }
        
        // Write to file
        fs.writeFileSync(filePath, JSON.stringify(positions, null, 2));
        console.log('Positions saved successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving positions:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to get positions
app.get('/get-positions', (req, res) => {
    fs.readFile(
        path.join(__dirname, 'public', 'positions.json'),
        'utf8',
        (err, data) => {
            if (err) {
                res.status(500).json({ error: 'Failed to read positions' });
                return;
            }
            res.json(JSON.parse(data));
        }
    );
});

// Add this route to check if template exists
app.get('/check-template', (req, res) => {
    const templatePath = path.join(__dirname, 'public', 'template.png');
    if (fs.existsSync(templatePath)) {
        res.send(`Template exists at: ${templatePath}`);
    } else {
        res.status(404).send(`Template not found at: ${templatePath}`);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 