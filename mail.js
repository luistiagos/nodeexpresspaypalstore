const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');

const createTransport = () => {
    const transport = nodemailer.createTransport(
        nodemailerSendgrid({
            apiKey:'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'
        })
    );
    return transport;
};

const sendEmail = async () => {
    const transporter = createTransport();
    const info = await transporter.sendMail({
        from: 'luistiago.andrighetto@gmail.com',
        to: 'tiago.hablich@gmail.com',
        subject: 'Ola',
        html: '<b>ola</b>'
    });
}

exports.sendEmail = () => sendEmail();