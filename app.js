require('dotenv').config();

const express = require('express');
const URL = require('./models/url')
const path = require('path');
const cookieParser = require('cookie-parser');
const { restrictTo, checkForAuthentication } = require('./middlewares/auth');
const { connectToMongoDB } = require('./connectDB');

const staticRoute = require('./routes/staticRouter')
const urlRoute = require('./routes/url');
const userRoute = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

connectToMongoDB(process.env.MONGO_URL).then(() => { console.log("MongoDB Connected!") })

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthentication);
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', staticRoute);
app.use('/url', restrictTo(['NORMAL']), urlRoute);
app.use('/user', userRoute);

app.get('/url/:shortID', async (req, res) => {
  const shortID = req.params.shortID;
  const entry = await URL.findOneAndUpdate(
    {
      shortID,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now()
        },
      },
    }
  );
  res.redirect(entry.redirectURL);
});

app.listen(PORT, () => {
  console.log("Server started at PORT:", PORT);
})