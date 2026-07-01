import dns from "dns/promises";

/**
 * Blocklist of known disposable/temporary email domains.
 * This list covers the most popular temp mail services.
 */
const DISPOSABLE_DOMAINS = new Set([
    // Major disposable email services
    "tempmail.com", "temp-mail.org", "temp-mail.io", "tempmailo.com",
    "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.de",
    "guerrillamailblock.com", "grr.la", "sharklasers.com", "guerrillamail.info",
    "mailinator.com", "mailinator.net", "mailinator2.com", "maildrop.cc",
    "yopmail.com", "yopmail.fr", "yopmail.net", "yopmail.gq",
    "throwaway.email", "throwaway.com",
    "10minutemail.com", "10minutemail.net", "10minutemail.org",
    "minutemail.com", "tempail.com",
    "dispostable.com", "trashmail.com", "trashmail.net", "trashmail.org",
    "trashmail.me", "trashmail.io", "trashymail.com", "trashymail.net",
    "mailnesia.com", "mailnator.com", "mailcatch.com",
    "fakeinbox.com", "fakemail.net", "fakemail.fr",
    "getnada.com", "nada.email", "nada.ltd",
    "mohmal.com", "mohmal.im", "mohmal.in", "mohmal.tech",
    "emailondeck.com", "emailfake.com",
    "crazymailing.com", "mytemp.email",
    "harakirimail.com", "mailsac.com",
    "burnermail.io", "inboxbear.com",
    "tempr.email", "tempmailaddress.com",
    "disposableemailaddresses.emailmiser.com",
    "mailtemp.info", "mailtemp.net",
    "tmpmail.net", "tmpmail.org",
    "getairmail.com", "filzmail.com",
    "discard.email", "discardmail.com", "discardmail.de",
    "spamgourmet.com", "spamgourmet.net",
    "mailexpire.com", "tempinbox.com",
    "emkei.cz", "anonymbox.com",
    "mintemail.com", "emailisvalid.com",
    "trash-mail.com", "trash-me.com",
    "mytrashmail.com", "mt2015.com",
    "thankyou2010.com", "binkmail.com",
    "safetymail.info", "bobmail.info",
    "mailzilla.com", "mailzilla.org",
    "klzlk.com", "mvrht.net",
    "tmail.ws", "tempemails.io",
    "emailna.co", "mailpoof.com",
    "jetable.org", "jetable.com", "jetable.net",
    "spambox.us", "spamfree24.org",
    "spaml.com", "spaml.de",
    "bugmenot.com", "notmailinator.com",
    "mailnull.com", "spamhereplease.com",
    "safetypost.de", "devnullmail.com",
    "mailblocks.com", "tempomail.fr",
    "temporaryinbox.com", "temporaryemail.net",
    "temporarymail.org", "temporarymailaddress.com",
    "tempsky.com", "tempemail.co",
    "tempemail.net", "tempemail.com",
    "mailforspam.com", "guerrillamail.biz",
    "incognitomail.org", "incognitomail.com",
    "anonbox.net", "mytempemail.com",
    "disposable.email", "emailsensei.com",
    "armyspy.com", "cuvox.de", "dayrep.com",
    "einrot.com", "fleckens.hu", "gustr.com",
    "jourrapide.com", "rhyta.com", "superrito.com",
    "teleworm.us", "tmail.com",
    // Russian temp mail
    "mailforspam.com", "tempmail.de", "wegwerfmail.de",
    "wegwerfmail.net", "wegwerfmail.org",
    // Additional common ones
    "sharklasers.com", "spam4.me", "grr.la",
    "pokemail.net", "spam.la",
    "bccto.me", "chacuo.net",
    "027168.com", "10mail.org",
    "33mail.com", "maildrop.cc",
    "mailnesia.com", "receiveee.com",
    "tempmailer.com", "tempmails.net",
]);

/**
 * Check if an email domain is disposable/temporary
 */
function isDisposableDomain(domain) {
    return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

/**
 * Verify domain has valid MX (mail exchange) records via DNS lookup.
 * This confirms the domain can actually receive email.
 */
async function hasMxRecords(domain) {
    try {
        const records = await dns.resolveMx(domain);
        return records && records.length > 0;
    } catch (err) {
        // ENOTFOUND = domain doesn't exist, ENODATA = no MX records
        return false;
    }
}

/**
 * Validate an email domain:
 * 1. Not a disposable/temp mail provider
 * 2. Has valid MX records (domain can receive mail)
 *
 * Returns { valid: true } or { valid: false, message: "..." }
 */
export async function validateEmailDomain(email) {
    const domain = email.split("@")[1]?.toLowerCase()?.trim();

    if (!domain) {
        return { valid: false, message: "Invalid email address" };
    }

    // Check against disposable domain blocklist
    if (isDisposableDomain(domain)) {
        return {
            valid: false,
            message: "Temporary or disposable email addresses are not allowed. Please use a permanent email address (e.g., Gmail, Outlook, Yahoo).",
        };
    }

    // Verify domain has MX records (can actually receive email)
    const hasMx = await hasMxRecords(domain);
    if (!hasMx) {
        return {
            valid: false,
            message: "This email domain does not exist or cannot receive emails. Please use a valid email address.",
        };
    }

    return { valid: true };
}
