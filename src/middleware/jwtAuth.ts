import jwt from 'jsonwebtoken';
import { Request } from "express";
import { ENV } from '../../config';

export const jwtAuth = (req: Request) => {
        const token = req.header('Authorization');
        if (!token) {
            throw new Error("Authorization token is missing");
        }
        if (token.startsWith("Bearer ") == false){
            throw new Error("Authorization token should start with Bearer");
       } 
       const jwtToken = token.substring(7, token.length);
        try {
            const decoded = jwt.verify(jwtToken, ENV.JWT_SECRET || '');
            req.user = decoded;
        } catch (err) {
            throw new Error("Invalid token");
        }
};