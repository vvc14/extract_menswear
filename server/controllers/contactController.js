import Contact from "../models/Contact.js";
import nodemailer from "nodemailer";

export const submitContact = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)*\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address (e.g., john@example.com)" });
        }

        const contact = await Contact.create({ name, email, message });

        // Send email using nodemailer
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: "janassistai@gmail.com",
                subject: `New Contact Request from ${name}`,
                text: `You have received a new message from your website contact form.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
            };

            transporter.sendMail(mailOptions).catch(err => console.error("Background email error:", err));
        } else {
            console.warn("EMAIL_USER and EMAIL_PASS are not set in .env. Email was not sent.");
        }

        res.status(201).json({ message: "Message sent successfully", id: contact._id });
    } catch (error) {
        console.error("Error submitting contact:", error);
        res.status(500).json({ message: "Failed to process request. Please check email configuration." });
    }
};
