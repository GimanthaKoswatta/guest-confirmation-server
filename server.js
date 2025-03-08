const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Load Firebase credentials from Railway environment variable
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
app.use(cors());

// Confirm guest attendance route
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

        return res.send("<h2>Thank you for confirming your attendance!</h2>");
    } catch (error) {
        console.error("Error updating guest:", error);
        return res.status(500).send("Internal Server Error: " + error.message);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));