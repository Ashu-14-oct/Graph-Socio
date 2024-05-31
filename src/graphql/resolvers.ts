import { SignupValidator } from "../validation/authValidation";

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

            const newUser = new context.models.User(input);
            await newUser.save();

            return newUser;
        }
    }
} 