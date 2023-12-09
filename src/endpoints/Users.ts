import { Request, Response } from 'express';
import connection from '../connection';
import { generateToken, comparePasswords, getData } from '../services/authenticator';
import { hash, compare } from '../services/hashManager';
import { LoginRequest } from '../types/LoginRequest';
import { User } from '../types/User';
import { SignupRequest } from '../types/SignupRequest';
import { EditUserRequest } from '../types/EditRequest';
import { DeleteUserRequest } from '../types/DeleteRequest';
import { generateId } from '../services/idGenerator';

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
      const user_Id = generateId();
      const userRole = role !== undefined ? role : 'paciente';

      await connection('users').insert({
        user_id: user_Id,
        nome,
        email,
        senha: hashedSenha,
        role: userRole,
      });

      const token = generateToken({ id: user_Id });

      res.status(201).json({ user_Id, token });

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
      const token = req.headers.authorization as string;

      if (!token) {
        throw { statusCode: 401, message: 'Token não fornecido.' };
      }

      const authenticationData = getData(token);
      const userRole = authenticationData.role;

      if (userRole !== 'admin') {
        throw { statusCode: 403, message: 'Você não tem acesso à essa rota.' };
      }

      let query = connection('users').select('*');

      if (req.query.role) {
        const role = (req.query.role as string).toLowerCase();
        query = query.where('role', role);
      }

      if (req.query.nome) {
        query = query.where('nome', 'ilike', `%${req.query.nome as string}%`);
      }

      const users = await query;
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Erro ao buscar usuários.';
      res.status(statusCode).json({ error: message });
    }
  };
  getMedicos = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization as string;

      if (!token) {
        throw { statusCode: 401, message: 'Token não fornecido.' };
      }

      const { nome, especializacao } = req.query;

      let query = connection('medicos').select('*');

      if (nome) {
        query = query.where('nome', 'ilike', `%${nome}%`);
      }
      if (especializacao) {
        query = query.where('especializacao', 'ilike', `%${especializacao}%`);
      }

      const medicos = await query;
      res.status(200).json(medicos);
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Erro ao buscar médicos.';
      res.status(statusCode).json({ error: message });
    }
  }
  editUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization as string;
      const { id: userId, role: userRole } = getData(token);
  
      const targetUserId = req.params.id;
  
      const { nome, email, senha, confirmSenha, role } = req.body as EditUserRequest;
  
      if (userRole !== 'admin' && userId !== targetUserId) {
        throw { statusCode: 403, message: 'Acesso negado.' };
      }
  
      const targetUser = await connection('users').where('user_id', targetUserId).select().first();
  
      if (!targetUser) {
        throw { statusCode: 404, message: 'Usuário não encontrado.' };
      }
      
      if(userRole !== 'admin'){
        if(!confirmSenha){
          throw {statusCode: 401, message: 'É necessario a confirmação da sua senha antiga.'}
        }
      }

      if (senha !== undefined && confirmSenha !== undefined && !(await compare(confirmSenha, targetUser.senha))) {
        throw { statusCode: 400, message: 'Confirmação de senha incorreta.' };
      }
  
      const updatedUserData: Record<string, any> = {};
  
      if (nome !== undefined) updatedUserData.nome = nome;
      if (email !== undefined) updatedUserData.email = email;
      if (senha !== undefined) updatedUserData.senha = await hash(senha);
      if (role !== undefined) updatedUserData.role = role;
  
      await connection('users').where('user_id', targetUserId).update(updatedUserData);
  
      res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Erro ao editar usuário. Verifique os logs para mais detalhes.';
      res.status(statusCode).json({ error: message });
    }
  };
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization as string;
      const { id: userId, role: userRole } = getData(token);
  
      const targetUserId = req.params.id;
  
      if (userRole !== 'admin' && userId !== targetUserId) {
        throw { statusCode: 403, message: 'Acesso negado.' };
      }
  
      const targetUser = await connection('users').where('user_id', targetUserId).select().first();
  
      if (!targetUser) {
        throw { statusCode: 404, message: 'Usuário não encontrado.' };
      }
  
      if (userRole !== 'admin') {
        const { confirmSenha } = req.body as DeleteUserRequest;
  
        if (!confirmSenha || !(await compare(confirmSenha, targetUser.senha))) {
          throw { statusCode: 400, message: 'Confirmação de senha incorreta.' };
        }
      }
  
      await connection('users').where('user_id', targetUserId).delete();
  
      res.status(200).json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Erro ao excluir usuário. Verifique os logs para mais detalhes.';
      res.status(statusCode).json({ error: message });
    }
  };
  
}

export default UserEndpoints;
