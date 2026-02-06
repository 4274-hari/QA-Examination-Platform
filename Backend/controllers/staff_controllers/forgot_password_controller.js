const { getDb } = require("../../config/db");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const forgotpassword = async (req, res) => {
  try {
    const db = getDb();
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await db
      .collection("staff")
      .findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(1000, 10000).toString();

    const hashedOtp = crypto
      .createHmac("sha256", process.env.OTP_SECRET)
      .update(otp)
      .digest("hex");

    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await db.collection("staff").updateOne(
      { email: normalizedEmail },
      {
        $set: {
          resetOtp: hashedOtp,
          resetOtpExpiry: otpExpiry,
        },
      },
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
  from: `"WEBOPS OF VEC" <${process.env.EMAIL_USER}>`,
  to: normalizedEmail,
  subject: "🔐 Password Reset OTP",
  text: `Your OTP is ${otp}. It is valid for 10 minutes.`,
  html: `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f4k; padding:0; margin:0;">
    <div style="max-width:600px; margin:auto; background:#ffffff;">

      <!-- Header -->
      <div style="background:#fdcc03; padding:28px; text-align:center;">
        <div style="
          width:60px;
          height:60px;
          background:#ffffff;
          border-radius:50%;
          margin:0 auto 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:26px;
        ">
          🔑
        </div>
        <h2 style="margin:0; color:#1f2937;">Password Reset</h2>
      </div>

      <!-- Body -->
      <div style="padding:30px; color:#1f2937;">
        <p style="font-size:16px;">Hello,</p>

        <p style="font-size:15px; line-height:1.6;">
          We received a request to reset your password. Please enter the following
          One-Time Password (OTP) to continue:
        </p>

        <!-- OTP Box -->
        <div style="text-align:center; margin:32px 0;">
          <div id="otp" style="
            display:inline-block;
            padding:18px 34px;
            font-size:30px;
            letter-spacing:10px;
            font-weight:700;
            background:#FFF7CC;
            border:2px solid #fdcc03;
            border-radius:12px;
            color:#1f2937;
            user-select:all;
          ">
            ${otp}
          </div>

          <!-- Copy Hint Button -->
          <div style="margin-top:12px;">
            <span style="
              display:inline-block;
              padding:8px 16px;
              font-size:13px;
              background:#FFD400;
              color:#1f2937;
              border-radius:20px;
              font-weight:600;
            ">
              📋 Tap & Copy OTP
            </span>
          </div>
        </div>

        <p style="font-size:14px; color:#374151;">
          ⏰ <strong>This OTP is valid for 10 minutes.</strong>
        </p>

        <p style="font-size:14px; color:#4b5563;">
          If you did not request this password reset, you can safely ignore this email.
          No changes will be made to your account.
        </p>

        <p style="margin-top:32px; font-size:14px;">
          Regards,<br/>
          <strong>WEBOPS OF VEC</strong>
        </p>
      </div>

      <script>
      function copyToClipboard() {
        const text = document.getElementById("otp").value;
        navigator.clipboard.writeText(text).then(() => {
        alert("Text copied to clipboard!");
        }).catch(err => {
        console.error("Failed to copy text: ", err);
        });
        }
      </script>

      <!-- Footer -->
      <div style="background:#f9fafb; padding:14px; text-align:center; font-size:12px; color:#6b7280;">
        © ${new Date().getFullYear()} WEBOPS OF VEC. All rights reserved.
      </div>

    </div>
  </div>
  `
});


    res.status(200).json({
      message: "OTP sent to email successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal Server error",
    });
  }
};

const otpValidation = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and otp is required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const hashedOtp = crypto
      .createHmac("sha256", process.env.OTP_SECRET)
      .update(otp)
      .digest("hex");

    const user = await db.collection("staff").findOne({
      email: normalizedEmail,
      resetOtp: hashedOtp,
      resetOtpExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    await db.collection("staff").updateOne(
      { email: normalizedEmail },
      {
        $unset: {
          resetOtp: "",
          resetOtpExpiry: "",
        },
      },
    );

    res.status(200).json({
      message: "Otp is validated",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const db = getDb();
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Email and  password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 8 && newPassword.length > 12) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await db.collection("staff").findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid Email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.collection("staff").updateOne(
      { email: normalizedEmail },
      {
        $set: {
          password: hashedPassword,
        },
      },
    );

    res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  forgotpassword,
  resetPassword,
  otpValidation,
};
