export interface UserJWT extends Express.User {
    userId: string,
}

export function isUserJWT(arg: any): arg is UserJWT {
    return arg.userId !== undefined;
}