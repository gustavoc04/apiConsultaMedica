import bcrypt from 'bcrypt';

export const hash = async (text: string): Promise<string> => {
    try {
        const rounds = Number(process.env.BCRYPT_COST);
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
