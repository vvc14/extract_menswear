import jwt from "jsonwebtoken";

// Every token type gets its own audience so one kind can never be replayed as another
// (e.g. an OTP proof token used as a login session).
const AUD = {
    user: "extract:user",
    admin: "extract:admin",
    signup: "extract:otp-signup",
    reset: "extract:otp-reset",
};

export const signUserToken = (user) =>
    jwt.sign(
        { id: String(user._id), email: user.email, role: user.role, type: "user", tv: user.tokenVersion || 0 },
        process.env.JWT_SECRET,
        { expiresIn: "7d", audience: AUD.user }
    );

// kind: "admin" for the Admin collection, "user" for a User with role "admin"
export const signAdminToken = (doc, kind) =>
    jwt.sign(
        {
            id: String(doc._id),
            username: doc.username || doc.name || doc.email,
            role: "admin",
            type: "admin",
            kind,
            tv: doc.tokenVersion || 0,
        },
        process.env.JWT_SECRET,
        { expiresIn: "12h", audience: AUD.admin }
    );

// `tv` binds a reset token to the account's token version, making it single-use
// (a successful reset increments tokenVersion).
export const signOtpToken = (email, purpose, tv = 0) =>
    jwt.sign({ email, purpose, tv }, process.env.JWT_SECRET, { expiresIn: "15m", audience: AUD[purpose] });

export const verifyOtpToken = (token, email, purpose, tv = 0) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { audience: AUD[purpose] });
    return decoded.purpose === purpose && decoded.email === email && (decoded.tv || 0) === (tv || 0);
};

// Verify a session token (user or admin). Returns the decoded payload or throws.
export const verifySessionToken = (token) =>
    jwt.verify(token, process.env.JWT_SECRET, { audience: [AUD.user, AUD.admin] });
