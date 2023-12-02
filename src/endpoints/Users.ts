import express, { Router, Request, Response } from 'express';
import connection from '../connection';
import { generateToken, hashPassword, receiveId, comparePasswords } from '../services/authenticator';

const usersRouter: Router = express.Router();

usersRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    const [user] = await connection('users').where('email', email).select();

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isSenhaValida = await comparePasswords(senha, user.senha);

    if (!isSenhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken({ id: user.userid });

    res.json({ userId: user.userid, nome: user.nome, email: user.email, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro no login' });
  }
});

usersRouter.post('/signup', async (req: Request, res: Response) => {
    try {
      const { nome, email, senha, role } = req.body;
  
      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      }
  
      const existingUser = await connection('users').where('email', email).select('userid').first();
  
      if (existingUser) {
        return res.status(400).json({ error: 'E-mail já cadastrado. Tente outro e-mail.' });
      }
  
      const hashedSenha = await hashPassword(senha);
  
      const userId = receiveId();
  
      const userRole = role !== undefined ? role : 'paciente';
  
      await connection('users').insert({
        userid: userId,
        nome,
        email,
        senha: hashedSenha,
        role: userRole,
      });
  
      const token = generateToken({ id: userId });
  
      res.status(201).json({ userId, nome, email, role: userRole, token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro no cadastro de usuário. Verifique os logs para mais detalhes.' });
    }
  });
  

usersRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await connection('users').select('*');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar usuários.' });
  }
});

usersRouter.get('/users/pacientes', async(req:Request, res:Response) => {
   try {
    const pacientes = await connection('users').select('*').where('role', 'paciente')
    res.json(pacientes)
   } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pacientes.' });
   }
})
usersRouter.get('/users/medicos', async(req:Request, res:Response) => {
    try {
     const medico = await connection('users').select('*').where('role', 'medico')
     res.json(medico)
    } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'Erro ao buscar medicos.' });
    }
 })

export default usersRouter;