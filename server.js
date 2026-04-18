const app = require('./src/app');
const PORT = process.env.PORT;

app.listen(PORT,  '0.0.0.0', () => {
    console.log(`Campus Swap & Drop modular server running at http://localhost:${PORT}`);
});
