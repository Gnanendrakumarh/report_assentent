import express from "express";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: ".env.local" });

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Plain object for Status (replaces enum)
const Status = {
  Completed: "Completed",
  InProgress: "In Progress",
  NoProgress: "No Progress",
} as const;

// Status messages
const statusMessages: Record<string, string> = {
  [Status.Completed]: `Congratulations, we sincerely appreciate the dedication you have shown in completing the courses. We encourage you to continue with your efforts.`,
  [Status.InProgress]: `We appreciate the effort you are putting in, and we kindly request you to expedite the completion of the lectures within the allocated timeframe. We would like to hear about any difficulties or challenges you may be facing.`,
  [Status.NoProgress]: `We appreciate the effort you are putting in, and we kindly request you to expedite the completion of the lectures within the allocated timeframe. We would like to hear about any difficulties or challenges you may be facing.`,
};

// Configure transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ========== EMAIL ROUTE ==========
app.post("/send-mails", async (req, res) => {
  const { candidates } = req.body;

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return res.status(400).json({ error: "Candidates array is required" });
  }

  try {
    for (const candidate of candidates) {
      console.log(` Sending email to ${candidate.email} ...`);

      const statusMessage = statusMessages[candidate.status] || "";

      // Build OCS section
      let ocsSection = `
        <p><b>OCS 1 (${candidate.ocs1Date || "N/A"}):</b> ${candidate.ocs1Status}</p>
        <p><b>OCS 2 (${candidate.ocs2Date || "N/A"}):</b> ${candidate.ocs2Status}</p>
      `;

      
      if (
        candidate.ocs1Status?.toLowerCase().trim() === "not attended" ||
        candidate.ocs2Status?.toLowerCase().trim() === "not attended"
      ) {
        ocsSection += `
          <p>Kindly request you to attend all the Online-Contact-Sessions which is a mandatory and essential part of your course.</p>
        `;
      }

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: candidate.email,
        subject: "Your Learners Report -AUGUST 2025",
        html: `
          <h3>Dear ${candidate.name},</h3>
          <br>
          <p>Greetings from MedTrain - Allergy Asthma Specialist Course.</p>
          <p>Please find the below-mentioned table of your progress for the month of August 2025.</p>
          <p><b>Chapter Complection:</b> ${candidate.chapterCompletion}</p>
          <p><b>Assessment:</b> ${candidate.marksObtained}/${candidate.maxMarks}</p>
          ${ocsSection}
          <p><b>Status:</b> ${candidate.status}</p>
          <p>${statusMessage}</p>
          <p>For Technical and Academic challenges please contact - 7975764489.</p>
          <p>Note: We request you to rename yourself to your registered name during online sessions to ensure your attendance is marked correctly.</p>
          <p><b>Note</b>:<li>Step 1️⃣ | Finish Viewing the Video on your Media Player.</li>
          <li>Step 2️⃣ | Click on the "Complete & Continue" button located at the Bottom Right of the media player. (On some devices, you might find this option under the 3 dots ⋮ Menu button at the Top Right of the media player).</li>
          <p>Kindly Ignore the above message if already done.</p>
          <br>
          <p>Thanks and Regards,</p>
          <p>MedTrain Team</p>
        `,
      });

      console.log(` Email sent to ${candidate.email}`);
    }

    res.json({ message: " Mail(s) sent successfully!" });
  } catch (err) {
    console.error(" Error sending mail:", err);
    res.status(500).json({ error: "Failed to send mails" });
  }
});


// ========== WHATSAPP ROUTE ==========
app.post("/send-whatsapp", async (req, res) => {
  const { candidates } = req.body;

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    console.error(" No candidates provided in request body");
    return res.status(400).json({ error: "Candidates array is required" });
  }

  try {
    for (const candidate of candidates) {
      console.log(` Preparing WhatsApp message for ${candidate.phone} (${candidate.name})`);

      const payload = {
  to: String(candidate.phone), 
  name: "assessmentreportingassistant",
  components: [
    {
      type: "body",
      parameters: [
        { type: "text", text: candidate.name || "-" },              
        { type: "text", text: String(candidate.chapterCompletion) || "0" }, 
        { type: "text", text: String(candidate.totalChapters) || "0" },     
        { type: "text", text: String(candidate.marksObtained) || "0" },     
        { type: "text", text: String(candidate.maxMarks) || "0" },          
        { type: "text", text: String(candidate.skippedQuestions) || "0" },  
        { type: "text", text: `OCS 1 (${candidate.ocs1Date || "N/A"}) : ${candidate.ocs1Status || "N/A"}` },  
        { type: "text", text: `OCS 2 (${candidate.ocs2Date || "N/A"}) : ${candidate.ocs2Status || "N/A"}` }, 
        { type: "text", text: candidate.status || "N/A" },           
        { type: "text", text: "August 2025" },              
      ],
    },
  ],
};


      console.log(" WhatsApp request payload:", JSON.stringify(payload, null, 2));

      const response = await fetch("https://aadyawhatsappmiddleware.onrender.com/send-template", {
        method: "POST",
        headers: {
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPd25lck5hbWUiOiJNZWRUcmFpbiIsInBob25lTnVtYmVySWQiOiIzMjUzODMwMTM5OTIxNTQiLCJ3aGF0c2FwcE1ldGFUb2tlbiI6IkVBQUdQaXBIZE10QUJQSXU5MDc2QWdBbXU5akh2d0JaQ3BLWEs2OERocEExWFpBUXc5UkNGbDlJMG9CR3V3Tkk5QVBKOWw1aUw5d3NscEJNQzhZU0xMWHRQeDJpaFdwUkI1c1N1Rmd4c0NVUHdmNTJhWkFCd0hWTmxnaVRjZ3J3aml4WkNFc3pNVVNYcmRwdmFKTGtHVFBqc1l2VTVaQmZjTXZSMXl5Tmpqb1RTVmo4eGlVZUNYVkhYazFYSTRuQVpEWkQiLCJpYXQiOjE3NTQwMzIxNjB9.k1DTVxel76DQGFbTYXpsJPA3yWjf6q3SqByNnkpays4", // replace with actual token
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log(" WhatsApp API status:", response.status, response.statusText);

      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.error(" Failed to parse WhatsApp API response as JSON:", jsonErr);
        data = await response.text();
      }

      console.log(" WhatsApp API response body:", data);
    }

    res.json({ message: " WhatsApp template(s) sent successfully!" });
  } catch (err) {
    console.error(" Error sending WhatsApp:", err);
    res.status(500).json({ error: "Failed to send WhatsApp message(s)" });
  }
});


// Root route for testing
app.get("/", (req, res) => {
  res.send(" Mail + WhatsApp API is running on Render!");
});

// Start server
app.listen(5000, () => {
  console.log(" Mail + WhatsApp server running on http://localhost:5000");
});
