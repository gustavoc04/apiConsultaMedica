export type Consulta = {
    consultaId: string;
    pacienteId: string;
    medicoId: string;
    nomePaciente: string;
    nomeMedico: string;
    data: string;
    horario: string;
    descricao: string;
    status: 'pendente' | 'confirmada' | 'cancelada';
};