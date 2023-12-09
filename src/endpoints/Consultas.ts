import { Request, Response } from 'express';
import connection from '../connection';
import { generateId } from '../services/idGenerator';
import { getData } from '../services/authenticator';
import { Consulta } from '../types/Consulta';

class ConsultaEndpoints {
    marcarConsulta = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization as string;
            if (!token) {
                throw { statusCode: 401, message: 'Token não fornecido.' };
            }

            const authenticationData = getData(token);
            const userRole = authenticationData.role;

            if (userRole !== 'paciente') {
                throw { statusCode: 403, message: 'Você não pode criar uma consulta como médico ou administrador.' };
            }

            const { data, horario, descricao, medico_id } = req.body as Consulta;
            const consulta_id = generateId();
            const paciente_id = authenticationData.id;

            if (!data || !horario || !paciente_id || !medico_id) {
                throw { statusCode: 400, message: 'Campos obrigatórios ausentes. Certifique-se de incluir medico_id.' };
            }

            const [paciente] = await connection('users').where('user_id', paciente_id).select('nome');
            const [medico] = await connection('medicos').where('medico_id', medico_id).select('nome');

            if (!paciente || !medico) {
                throw { statusCode: 404, message: 'Paciente ou médico não encontrado.' };
            }

            const novaConsulta = {
                consulta_id,
                medico_id,
                paciente_id,
                nome_paciente: paciente.nome,
                nome_medico: medico.nome,
                data,
                horario,
                descricao,
                status: 'pendente',
            };

            await connection('consultas').insert(novaConsulta);

            res.status(201).json(novaConsulta);
        } catch (error) {
            console.error(error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Erro ao criar consulta.';
            res.status(statusCode).json({ error: message });
        }
    };

    getConsultas = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization as string;

            if (!token) {
                throw { statusCode: 401, message: 'Token não fornecido.' };
            }
            const authenticationData = getData(token);
            const userRole = authenticationData.role;

            let query = connection('consultas');

            if (userRole !== 'admin') {
                if (userRole === 'paciente') {
                    query = query.where('paciente_id', authenticationData.id);
                } else if (userRole === 'medico') {
                    query = query.where('medico_id', authenticationData.id);
                }
            }

            if (req.query.data) {
                query = query.where('data', '=', req.query.data as string);
            }
            if (req.query.horario) {
                query = query.where('horario', '=', req.query.horario as string);
            }
            if (req.query.descricao) {
                query = query.where('descricao', 'like', `%${req.query.descricao as string}%`);
            }

            if (req.query.orderBy && (req.query.orderBy === 'asc' || req.query.orderBy === 'desc')) {
                query = query.orderBy('data', req.query.orderBy).orderBy('horario', req.query.orderBy);
            }

            const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
            const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
            const offset = (page - 1) * pageSize;

            query = query.limit(pageSize).offset(offset);

            const consultas = await query;

            res.status(200).json(consultas);
        } catch (error) {
            console.error(error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Erro ao obter consultas.';
            res.status(statusCode).json({ error: message });
        }
    };
    editConsulta = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization as string;

            if (!token) {
                throw { statusCode: 401, message: 'Token não fornecido.' };
            }

            const authenticationData = getData(token);
            const userRole = authenticationData.role;

            if (userRole !== 'admin' && userRole !== 'medico') {
                throw { statusCode: 403, message: 'Você não tem permissão para editar esta consulta.' };
            }

            const consultaId: string = req.params.id;
            const { data, horario, descricao } = req.body;

            const consulta = await connection('consultas')
                .where('consulta_id', consultaId)
                .first();

            if (!consulta) {
                throw { statusCode: 404, message: 'Consulta não encontrada.' };
            }

            if (userRole !== 'admin' && authenticationData.id !== consulta.medico_id) {
                throw { statusCode: 403, message: 'Você não tem permissão para editar esta consulta.' };
            }

            const updatedConsulta: Record<string, any> = {};

            if (data) {
                updatedConsulta.data = data;
            }

            if (horario) {
                updatedConsulta.horario = horario;
            }

            if (descricao) {
                updatedConsulta.descricao = descricao;
            }

            await connection('consultas')
                .where('consulta_id', consultaId)
                .update(updatedConsulta);

            res.status(200).json({ message: 'Consulta atualizada com sucesso.' });
        } catch (error) {
            console.error(error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Erro ao editar consulta.';
            res.status(statusCode).json({ error: message });
        }
    };
    confirmarConsulta = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization as string;

            if (!token) {
                throw { statusCode: 401, message: 'Token não fornecido.' };
            }

            const authenticationData = getData(token);
            const userRole = authenticationData.role;
            const consultaId: string = req.params.id;

            const consulta = await connection('consultas')
                .where('consulta_id', consultaId)
                .first();

            if (!consulta) {
                throw { statusCode: 404, message: 'Consulta não encontrada.' };
            }

            if (userRole !== 'admin' && authenticationData.id !== consulta.medico_id) {
                throw { statusCode: 403, message: 'Você não tem permissão para confirmar esta consulta.' };
            }

            await connection('consultas')
                .where('consulta_id', consultaId)
                .update({ status: 'confirmada' });

            res.status(200).json({ message: 'Consulta confirmada com sucesso.' });
        } catch (error) {
            console.error(error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Erro ao confirmar consulta.';
            res.status(statusCode).json({ error: message });
        }
    };

    cancelarConsulta = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization as string;

            if (!token) {
                throw { statusCode: 401, message: 'Token não fornecido.' };
            }

            const authenticationData = getData(token);
            const userRole = authenticationData.role;
            const consultaId: string = req.params.id;

            const consulta = await connection('consultas')
                .where('consulta_id', consultaId)
                .first();

            if (!consulta) {
                throw { statusCode: 404, message: 'Consulta não encontrada.' };
            }

            if (userRole !== 'admin' && (authenticationData.id !== consulta.medico_id && authenticationData.id !== consulta.paciente_id)) {
                throw { statusCode: 403, message: 'Você não tem permissão para cancelar esta consulta.' };
            }

            await connection('consultas')
                .where('consulta_id', consultaId)
                .update({ status: 'cancelada' });

            res.status(200).json({ message: 'Consulta cancelada com sucesso.' });
        } catch (error) {
            console.error(error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Erro ao cancelar consulta.';
            res.status(statusCode).json({ error: message });
        }
    };

    deleteConsulta = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization as string;
            const authenticationData = getData(token);

            if (authenticationData.role !== 'admin') {
                throw { statusCode: 403, message: 'Você não tem permissão para excluir esta consulta.' };
            }

            const consultaId: string = req.params.id;

            const consulta = await connection('consultas')
                .where('consulta_id', consultaId)
                .first();

            if (!consulta) {
                throw { statusCode: 404, message: 'Consulta não encontrada.' };
            }

            await connection('consultas')
                .where('consulta_id', consultaId)
                .delete();

            res.status(200).json({ message: 'Consulta excluída com sucesso.' });
        } catch (error) {
            console.error(error);
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Erro ao excluir consulta.';
            res.status(statusCode).json({ error: message });
        }
    };

}

export default ConsultaEndpoints;
