export type Consulta = {
    consulta_id: string;
    paciente_id: string;
    medico_id: string;
    nome_Paciente: string;
    nome_Medico: string;
    data: string;
    horario: string;
    descricao: string;
    status: 'pendente' | 'confirmada' | 'cancelada';
};