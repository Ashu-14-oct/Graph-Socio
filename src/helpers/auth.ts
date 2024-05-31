import bcrypt from 'bcrypt';

export const hashPassword = async (passwordInput: any) => {
    try{
        const salt = await bcrypt.genSalt(14);
        const hashedPassword = await bcrypt.hash(passwordInput, salt);

        return hashedPassword;
    }catch(err){
        return err;
    }
}