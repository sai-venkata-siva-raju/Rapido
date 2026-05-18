const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const app = express();
const userRoutes = require('./routes/user.routes');
const swaggerSpec = require('./docs/swagger');
const cookieParser = require('cookie-parser');
const captainRoutes = require('./routes/captain.routes');
const MapsRoutes = require('./routes/maps.routes');
const rideRoutes = require('./routes/ride.routes');
const paymentRoutes = require('./routes/payment.routes');

app.use(cookieParser());


app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec));
app.get('/api-docs/', swaggerUi.setup(swaggerSpec));

app.use('/api/users', userRoutes);
app.use('/api/captains', captainRoutes);
app.use('/api/maps', MapsRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/',(req,res)=>{
    res.send('Hello World!');
    });

module.exports = app;
