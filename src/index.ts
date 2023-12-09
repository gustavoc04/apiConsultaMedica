import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import UserEndpoints from './endpoints/Users';
import ConsultaEndpoints from './endpoints/Consultas';

const app = express();

app.use(express.json());
app.use(cors());

const usersEndpoints = new UserEndpoints();
const consultaEndpoints = new ConsultaEndpoints();

app.post('/login', usersEndpoints.login);
app.post('/signup', usersEndpoints.signup);
app.get('/users', usersEndpoints.getUsers);
app.get('/medicos', usersEndpoints.getMedicos);
app.put('/users/:id/edit', usersEndpoints.editUser);
app.delete('/users/:id/delete', usersEndpoints.deleteUser);
app.post('/consultas', consultaEndpoints.marcarConsulta);
app.get('/consultas', consultaEndpoints.getConsultas);
app.put('/consultas/:id/edit', consultaEndpoints.editConsulta);
app.delete('/consultas/:id/delete', consultaEndpoints.deleteConsulta);
app.put('/consultas/:id/confirmar', consultaEndpoints.confirmarConsulta);
app.put('/consultas/:id/cancelar', consultaEndpoints.cancelarConsulta);

app.listen(process.env.PORT, () => {
  console.log(`Server is running in http://localhost:${process.env.PORT}`);
});
