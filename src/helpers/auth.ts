import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"

export const hashPassword = async (passwordInput: any) => {
    try{
        const salt = await bcrypt.genSalt(14);
        const hashedPassword = await bcrypt.hash(passwordInput, salt);

        return hashedPassword;
    }catch(err){
        return err;
    }
}

export const comparePassword = async (plainPassword: any, hashedPassword: any) => {
    try {
        const isPassword = await bcrypt.compare(plainPassword, hashedPassword);
        return isPassword;
    } catch (error) {
        return error
    }
}

export const getToken = async (userInput: any) => {
    try {
        const token = jwt.sign({id: userInput._id}, process.env.PRIVATE_KEY || '', {expiresIn: '4h'});

        return token
    } catch (error) {
        return error
    }
}

export const decryptToken = async (token: string) => {
    try {
        const user = await jwt.verify(token, process.env.PRIVATE_KEY || '');
        return user;
    } catch (error) {
        return null;
    }
}