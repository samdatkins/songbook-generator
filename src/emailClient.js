export async function sendEmail(
  toEmailAddress,
  subject,
  text,
  html,
  attachment,
) {
  const sgMail = require("@sendgrid/mail");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: toEmailAddress,
    from: "sam.d.atkins@gmail.com",
    subject: subject,
  };

  html && (msg.html = html);
  text && (msg.text = text);
  console.log(msg);
  attachment &&
    (msg.attachments = [
      {
        content: attachment,
        filename: "songbook.docx",
        type:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        disposition: "attachment",
        contentId: "mytext",
      },
    ]);
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.err(`failed to send email: ${err}`);
  }
}
