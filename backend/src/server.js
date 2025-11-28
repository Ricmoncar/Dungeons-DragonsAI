const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);

app.get('/', (req, res) => {
    res.send('DND_IA Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
