const nodemailer = require('nodemailer');
const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = require('./utils');

const transport = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: true,
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS
    }
});

const makeANiceEmail = (text) => `
    <div className="email" style="
        border: 1px solid black;
        padding: 20px;
        font-family: sans-serif;
        line-height: 2;
        font-size: 20px;
    ">
        <p>${text}</p>
    </div>
`;

exports.transport = transport;
exports.makeANiceEmail = makeANiceEmail;