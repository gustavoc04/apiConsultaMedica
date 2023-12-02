import bcrypt from 'bcrypt';

export const hash = async (text: string, rounds: number): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(rounds);
        const cypherText = await bcrypt.hash(text, salt);
        return cypherText;
    } catch (error) {
        throw new Error('Erro ao gerar hash.');
    }
};

export const compare = async (s: string, hash: string): Promise<boolean> => {
    try {
        const result = await bcrypt.compare(s, hash);
        return result;
    } catch (error) {
        throw new Error('Erro ao comparar hashes.');
    }
};
