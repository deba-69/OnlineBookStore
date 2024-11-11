const router = require("express").Router();
const User = require("../models/user");
const Book = require("../models/book");
const Order = require("../models/order");
const { authenticateToken } = require("./userAuth");
const Razorpay = require("razorpay");
const { validatePaymentVerification } = require('razorpay/dist/utils/razorpay-utils');

//place order
router.post("/place-order", authenticateToken, async (req, res) => {

    try{
        const { id } = req.headers;
        const { order, response } = req.body;
        // console.log(response);
        var instance = new Razorpay({ key_id: 'rzp_test_JcFPR4o6XJnTf8', key_secret: 'jKf6XfHjKxFy1caeGK7s5p87' });
        const isValid = validatePaymentVerification(
            { order_id: response.razorpay_order_id, payment_id: response.razorpay_payment_id },
            response.razorpay_signature,
            'jKf6XfHjKxFy1caeGK7s5p87'
        );
        if(!isValid)
        {
            // console.log("payment cannot be done!!");
            return res.status(400).json({message: "Unverified source"});
        }

        for(const orderData of order){
            console.log(orderData);
            const newOrder = new Order({user: id, book: orderData._id});
            const orderDataFromDb = await newOrder.save();
            //saving order in user model
            await User.findByIdAndUpdate(id, { $push: {orders: orderDataFromDb._id} });

            //clearing cart
           let result =  await User.findByIdAndUpdate(id, { $pull: {cart: orderData._id} });
        //    console.log(result);
        }

        return res.json({
            status: "success",
            message: "Order placed successfully",
        });
    }catch(error){
        console.log(error);
        return res.status(500).json({message:"An error occured"});
    }
});

router.post("/razorpay", authenticateToken, async (req,res) => {
    try{
        const { id } = req.headers;
        const { Total } = req.body;

        var instance = new Razorpay({ key_id: 'rzp_test_JcFPR4o6XJnTf8', key_secret: 'jKf6XfHjKxFy1caeGK7s5p87' })

        let data = await instance.orders.create({
        amount: Total*100,
        currency: "INR",
        receipt: "receipt#1",
        notes: {
            key1: "value3",
            key2: "value2"
        }
        });

        return res.status(200).json({data});
    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json({message: "An Error occured."});
    }
});
//get order history of an user
router.get("/get-order-history", authenticateToken, async (req,res) => {
    try{
        const {id} = req.headers;
        const userData = await User.findById(id).populate({
            path: "orders",
            populate: {path: "book"},
        });
        
        const ordersData = userData.orders.reverse();
        // console.log(userData);
        return res.json({
            status: "success",
            data: ordersData,
        });

    }catch(error){
        return res.status(500).json({message: "An error occured"});
    }
});

//get all orders
router.get("/get-all-orders", authenticateToken, async (req,res) => {
    try{
        
        const userData = await Order.find()
                        .populate({
                            path: "book",
                        })
                        .populate({
                            path: "user",
                        })
                        .sort({ createdAt: -1 });

        return res.json({
            status: "success",
            data: userData,
        });

    }catch(error){
        return res.status(500).json({message: "An error occured"});
    }
});

//update order --admin
router.put("/update-status/:id", authenticateToken, async (req,res) => {
    try{
        const {id} = req.params;
        await Order.findByIdAndUpdate(id, { status: req.body.status });

        return res.json({
            status: "success",
            message: "status updated successfully",
        });

    }catch(error){
        return res.status(500).json({message: "An error occured"});
    }
});
module.exports = router;