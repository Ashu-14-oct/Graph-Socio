import { comparePassword, getToken, hashPassword } from "../helpers/auth";
import { SigninValidator, SignupValidator } from "../validation/authValidation";

export const resolvers = {
    Query: {
        getUser: async (_ : any, __ : any, context: any) => {
            return  {
                id: '123',
                name: 'ashu',
                email: 'ashu@mail',
                password: '123',
            };
        }
    },
    Mutation: {
        createUser: async (_ : any, args: any, context: any) => {
            const { input } = args;
            const error = await SignupValidator(input);
            if(error){
                throw new Error(error.details[0].message);
            }
            const user = await context.models.User.findOne({email: input.email});
            if(user){
                throw new Error("User already exist with this email, try different email");
            }

            const hashedPassword = await hashPassword(input.password);

            const newUser = new context.models.User({
                ...input,
                password: hashedPassword,
            });
            await newUser.save();

            return newUser;
        },
        signInUser: async (_ : any, args : any, context: any) => {
            const { input } = args;
            const error = await SigninValidator(input);
            if(error){
                throw new Error(error.details[0].message);
            }

            const user = await context.models.User.findOne({email: input.email});
            if(!user){
                throw new Error("User with this email does not exist");
            }

            const isPassword = await comparePassword(input.password, user.password);
            if(!isPassword){
                throw new Error("Wrong password!");
            }

            const token = getToken(user);

            return {
                ...user._doc,
                token
            }
        }
    }
} 