const nodemailer = require('nodemailer');
const nodemailerSendgrid = require('nodemailer-sendgrid');

const propertiesReader = require('properties-reader');
var properties = propertiesReader('../props.txt');

const createTransport = () => {
    const transport = nodemailer.createTransport(
        nodemailerSendgrid({
            apiKey: properties.get('sendgrid-key')
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