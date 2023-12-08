export type SignupRequest = {
    nome: string;
    email: string;
    senha: string;
    role?: 'paciente' | 'medico' | 'admin';
};