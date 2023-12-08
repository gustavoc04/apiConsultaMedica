import { Request, Response } from 'express';
import connection from '../connection';
import { generateToken, receiveId, comparePasswords } from '../services/authenticator';
import { hash } from '../services/hashManager';
import { LoginRequest } from '../types/LoginRequest';
import { User } from '../types/User';
import { SignupRequest } from '../types/SignupRequest';

class UserEndpoints {
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, senha } = req.body as LoginRequest;

      if (!email || !senha) {
        throw { statusCode: 400, message: 'Email e senha são obrigatórios' };
      }

      const [user] = await connection('users').where('email', email).select();

      if (!user) {
        throw { statusCode: 401, message: 'Credenciais inválidas' };
      }

      const isSenhaValida = await comparePasswords(senha, user.senha);

      if (!isSenhaValida) {
        throw { statusCode: 401, message: 'Credenciais inválidas' };
      }

      const token = generateToken({ id: user.user_id, role: user.role });

      res.status(200).json({ user_Id: user.user_id, token });
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Erro no login';
      res.status(statusCode).json({ error: message });
    }
  };

  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const { nome, email, senha, role } = req.body as SignupRequest;

      if (!nome || !email || !senha) {
        throw { statusCode: 400, message: 'Campos obrigatórios ausentes' };
      }

      const existingUser = await connection('users').where('email', email).select('user_id').first();

      if (existingUser) {
        throw { statusCode: 400, message: 'E-mail já cadastrado. Tente outro e-mail.' };
      }

      const hashedSenha = await hash(senha);
      const user_Id = receiveId();
      const userRole = role !== undefined ? role : 'paciente';

      // Insert user into the 'users' table
      await connection('users').insert({
        user_id: user_Id,
        nome,
        email,
        senha: hashedSenha,
        role: userRole,
      });

      const token = generateToken({ id: user_Id });

      res.status(201).json({ user_Id, nome, email, role: userRole, token });

      if (userRole === 'medico') {
        await connection('medicos').insert({
          medico_id: user_Id,
          nome,
          especializacao: 'Clinico Geral'
        });
      }
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Erro no cadastro de usuário. Verifique os logs para mais detalhes.';
      res.status(statusCode).json({ error: message });
    }
  };

  getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      let query = connection('users').select('*');

      if (req.query.role) {
        const role = (req.query.role as string).toLowerCase();
        query = query.where('role', role);
      }

      if (req.query.nome) {
        query = query.where('nome', 'ilike', `%${req.query.nome as string}%`);
      }

      const users = await query;
      res.json(users);

    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Erro ao buscar usuários.';
      res.status(statusCode).json({ error: message });
    }
  };
  getMedicos = async (req:Request, res:Response) => {

  }
  
}

export default UserEndpoints;
