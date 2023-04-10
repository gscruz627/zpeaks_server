import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const verifyToken = async(req, res, next) => {
    try{
        let token = req.headers.authorization?.split(' ')[1]
        if (token) {
            if (token.startsWith("Tkn_bearer ")){
                token = token.slice(11,token.length).trimLeft();
            }
            const verified = jwt.verify(token, process.env.JWT_SIGNATURE);
            req.user = verified;
            next();
        } else {
            req.user = undefined;
            next();
        }
        
    } catch(err) {
        res.status(500).json({error: err})
    }
}
export default verifyToken;