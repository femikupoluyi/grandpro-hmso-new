const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'frontend' });
});

// Catch all - serve index.html for client-side routing
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
});
