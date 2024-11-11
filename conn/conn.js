const mongoose = require("mongoose");

const conn = async () => {

    try{
        await mongoose.connect(`${process.env.URI}`);
        console.log("db connected");
    }catch(error){
        console.log(error)
    }
};

conn();