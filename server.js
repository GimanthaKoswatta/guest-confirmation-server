const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK with Base64-decoded key
const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Enable CORS (allows requests from anywhere)
app.use(cors());

// Route to confirm guest attendance
app.get("/confirm", async (req, res) => {
    const guestId = req.query.guestId;

    if (!guestId) {
        return res.status(400).send("Invalid request: Missing guest ID.");
    }

    try {
        const usersSnapshot = await db.collection("users").get();
        let guestUpdated = false;

        for (let userDoc of usersSnapshot.docs) {
            let guestRef = db.collection("users").doc(userDoc.id).collection("guests").doc(guestId);
            let guestDoc = await guestRef.get();

            if (guestDoc.exists) {
                await guestRef.update({ isConfirmed: true });
                guestUpdated = true;
                break;
            }
        }

        if (!guestUpdated) {
            return res.status(404).send("Guest not found.");
        }

        return res.send(`
            <html>
                <head><title>Confirmation Successful</title></head>
                <body style="text-align:center; padding: 20px; font-family: Arial;">
                    <h2>Thank you for confirming your attendance!</h2>
                    <p>Your confirmation has been successfully recorded.</p>
                </body>
            </html>
        `);
    } catch (error) {
        console.error("Error updating guest:", error);
        return res.status(500).send("Internal Server Error: " + error.message);
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));