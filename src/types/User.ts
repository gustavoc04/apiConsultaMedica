export type User = {
    userId: string;
    nome: string;
    email: string;
    role: 'paciente' | 'medico' | 'admin';
};