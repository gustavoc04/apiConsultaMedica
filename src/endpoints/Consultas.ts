import { Request, Response } from 'express';
import connection from '../connection';
import { generateId } from '../services/idGenerator';
import { Consulta } from '../types/Consulta';

class ConsultaEndpoints {
  marcarConsulta = async (req: Request, res: Response): Promise<void> => {
    try {
      const { data, horario, medico_id, descricao } = req.body as Consulta

      if (!data || !horario || !medico_id) {
        throw { statusCode: 400, message: 'Campos obrigatórios ausentes.' };
      }

      const consulta_id = generateId()

      const novaConsulta = {
        consulta_id,
        medico_id: medico_id,
        data,
        horario,
        descricao,
      };

      await connection('consultas').insert({novaConsulta});

      res.status(201).json(novaConsulta);
    } catch (error) {
      console.error(error);
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Erro ao criar consulta.';
      res.status(statusCode).json({ error: message });
    }
  };
}

export default new ConsultaEndpoints();