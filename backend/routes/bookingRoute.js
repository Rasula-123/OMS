const express = require("express");
const { Bookingmodel } = require("../models/bookingModel");
const { authentication } = require("../middlewares/authenticationMiddleware");
const {authorisation}=require("../middlewares/authorizationMiddleware");
const bookingRoutes = express.Router();
const nodemailer = require("nodemailer")
require("dotenv").config()


bookingRoutes.get("/paticularUser", authentication,authorisation(["patient"]),async (req, res) => {//getting paticular user booking data
    let userId = req.body.userId;
    try {
        const reqData = await Bookingmodel.find({ userId });
        res.json({" msg": `All booking data of userId ${userId}`, "Data": reqData })
    } catch (error) {
        console.log("error from getting paticular user booking data", error.message);
        res.json({ "msg": "error in getting paticular user booking data", "errorMsg": error.message })
    }
})

bookingRoutes.get("/:doctorId",authentication,authorisation(["doctor"]), async (req, res) => {//getting paticular doctor booking data
    let doctorId = req.params.doctorId;
    try {
        const reqData = await Bookingmodel.find({ doctorId });
        res.json({ "msg": `All booking data of doctorId ${doctorId}`, "Data": reqData })
    } catch (error) {
        console.log("error from getting paticular doctor booking data", error.message);
        res.json({ "msg": "error in getting paticular doctor booking data", "errorMsg": error.message })
    }
})

bookingRoutes.post("/create",authentication,authorisation(["patient"]) , async (req, res) => {//create new booking
    const data = req.body;
    try {
        let allBookings = await Bookingmodel.find({ doctorId: data.doctorId })
        if (allBookings.length === 0) {
            const addData = new Bookingmodel(data);
            await addData.save();
        } else {
            for (let i = 0; i < allBookings.length; i++) {
                if (allBookings[i].bookingDate === data.bookingDate&&allBookings[i].bookingSlot === data.bookingSlot) {
                        res.json({ "msg": "This Slot is Not Available." })
                        return;
                }
            }
            const addData = new Bookingmodel(data);
            await addData.save();
        }
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ajitkhatua286@gmail.com',
                pass: process.env.emailpassword
            }
        });
        const mailOptions = {
            from: 'ajitkhatua286@gmail.com',
            to: `${data.userEmail}`,
            subject: 'Booking Confirmation from Rapid fit',
            text: `Your Booking is confirmed on ${data.bookingDate} date at ${data.bookingSlot} slot.`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                //console.log(error);
                return res.status(500).json({ "msg": 'Error while sending conformation mail' });
            } else {
                return res.status(200).json({ "msg": "new booking created successfully Confiramtion sent to email" });
            }
        });

    } catch (error) {
        console.log("error from adding new booking data", error.message);
        res.json({ msg: "error in adding new booking data", "errorMsg": error.message })
    }
})


bookingRoutes.delete("/remove/:id", authentication,authorisation(["patient"]),async (req, res) => {//removing the booking data
    const ID = req.params.id
    //console.log(ID);

    try {
        let reqData=await Bookingmodel.find({_id:ID});
        let specificDate = new Date(`${reqData[0].bookingDate}`);
        let currentDate = new Date();
        if(currentDate>specificDate){
            return res.json({"msg":"Meeting Already Over"})
        }else{
            let timeDiff = Math.abs(currentDate.getTime() - specificDate.getTime());
            let daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            if(daysDiff>=1){
                await Bookingmodel.findByIdAndDelete({ _id: ID });
                res.json({ "msg": `booking id of ${ID} is deleted succesfully` })
            }else{
                return res.json({"msg":"Our cancellation policy requires a minimum one-day notice for booking deletions."})
            }
            
        }
        
    } catch (error) {
        console.log("error from deleting booking data", error.message);
        res.json({ "msg": "error in deleting of booking data", "errorMsg": error.message })
    }
})

module.exports = {
    bookingRoutes
}


// Pediatrician
// Obstetricians/gynecologist (OBGYNs)
// Cardiologist
// Oncologist
// Gastroenterologist
// Pulmonologist
// Infectious disease
// Nephrologist
// Endocrinologist
// Ophthalmologist
// Otolaryngologist
// Dermatologist
// Psychiatrist
// Neurologist
// Radiologist
// Anesthesiologist
// Surgeon
// Physician executive