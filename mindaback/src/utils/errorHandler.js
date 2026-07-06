import { StatusCodes } from "http-status-codes";

export class Customerror extends Error {
    statusCode;
    status="error";
    comingfrom;
    constructor(message,comingfrom){
        super(message);
        this.comingfrom = comingfrom;
    }

    seriyalizeErrors(){
        return {
            message:this.message,
            statusCode:this.statusCode,
            status:this.status,
            comingfrom:this.comingfrom
        }
    }
};

export class BadRequestError extends Customerror{
    statusCode=StatusCodes.BAD_REQUEST;
    constructor(message,comingfrom){
        super(message,comingfrom);
    };
};

export class NotFoundError extends Customerror{
    statusCode=StatusCodes.NOT_FOUND;
    constructor(message,comingfrom){
        super(message,comingfrom);
    };
};

export class UnAuthorizedError extends Customerror{
    statusCode=StatusCodes.UNAUTHORIZED;
    constructor(message,comingfrom){
        super(message,comingfrom);
    };
};



