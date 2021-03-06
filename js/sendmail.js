'use strict';
const nodemailer = require('nodemailer');

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
var sendmail = (toEmail,code,subject) => {
  const msg = {
  to: toEmail,
  from: 'support@zakatlists.com',
  subject: subject,
  text: `Please enter ${code} under the verification input.`,
  html: `<strong>Please enter ${code} under the verification input</strong>`,
};
  return sgMail.send(msg)
}

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing
// var sendmail = (toEmail,code,subject) => {
//   return new Promise((resolve, reject) => {
//
//     nodemailer.createTestAccount((err, account) => {
//         // create reusable transporter object using the default SMTP transport
//         let transporter = nodemailer.createTransport({
//             service: 'Gmail',
//             auth: {
//                 user: process.env.EMAIL_ID, // generated ethereal user
//                 pass: process.env.EMAIL_PASSWORD // generated ethereal password
//             }
//         });
//
//         // setup email data with unicode symbols
//         let mailOptions = {
//             from: '"Zakat Lists - Verification Code" <contact@zakatlists.com>', // sender address
//             to: toEmail, // list of receivers
//             subject: subject, // Subject line
//             text: '', // plain text body
//             html: `
//             <section style="font-size:18px; padding:1rem">
//               <p>${code}</p>
//               <br>
//               <small><br>
//                 * Don't reply to this email, it is a computer generated message. *
//               </small>
//             </section>
//             ` // html body
//         };
//
//         // send mail with defined transport object
//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//               console.log(error);
//               return reject(error);
//             }
//             // console.log('Message sent: %s', info.messageId);
//             // Preview only available when sending through an Ethereal account
//             // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
//
//             resolve('Mail sent !');
//             // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
//             // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
//         });
//     });
//
//   })
// }


module.exports = {sendmail};
