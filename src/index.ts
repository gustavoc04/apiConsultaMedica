// index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import UserEndpoints from './endpoints/Users';

const app = express();

app.use(express.json());
app.use(cors());

const usersEndpoints = new UserEndpoints();

app.post('/login', usersEndpoints.login);
app.post('/signup', usersEndpoints.signup);
app.get('/users', usersEndpoints.getUsers);

app.listen(process.env.PORT, () => {
  console.log(`Server is running in http://localhost:${process.env.PORT}`);
});
