export async function sendEmail(tabAttachment) {
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: "sambowatkins@gmail.com",
    from: "sam.d.atkins@gmail.com",
    subject: "Songbook Generated",
    text: "Attached is your songbook",
    attachments: [
      {
        content: tabAttachment,
        filename: "songbook.docx",
        type:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        disposition: "attachment",
        contentId: "mytext",
      },
    ],
  };
  await sgMail.send(msg);
}