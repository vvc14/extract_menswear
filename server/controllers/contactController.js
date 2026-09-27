import Contact from "../models/Contact.js";
import { handleError } from "../utils/httpError.js";
import { notifyAdmin } from "../services/orderService.js";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

export const submitContact = async (req, res) => {
    try {
        const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
        const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
        const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
        if (!name || !email || !message) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (name.length > 100 || email.length > 200 || message.length > 5000) {
            return res.status(400).json({ message: "Your message is too long" });
        }
        if (!EMAIL_RE.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address (e.g., john@example.com)" });
        }

        const contact = await Contact.create({ name, email, message });
        notifyAdmin(
            `New Contact Request from ${name.replace(/[\r\n]+/g, " ")}`,
            `You have received a new message from your website contact form.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
            email
        );
        res.status(201).json({ message: "Message sent successfully", id: contact._id });
    } catch (error) {
        handleError(res, error, "Submit contact");
    }
};
