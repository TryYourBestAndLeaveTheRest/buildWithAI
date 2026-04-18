const app = require('./src/app');
const PORT = process.env.PORT || 8080;

app.listen(PORT,  '0.0.0.0', () => {
    console.log(`Campus Swap & Drop modular server running at http://localhost:${PORT}`);
});
