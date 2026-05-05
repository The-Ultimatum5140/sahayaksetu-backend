import Queue from "../models/QueueModel.js";

export const chatbotReply = async (req, res) => {
try {
const { message } = req.body;

// ✅ clean + safe input
const userMessage = message?.toLowerCase().trim() || "";
const userId = req.userId;

let reply =
  "Mujhe samajh nahi aaya 😅\nAap puch sakte hain:\n- Mera token kya hai?\n- Queue status";

// TOKEN / QUEUE QUERY
if (
  userMessage.includes("token") ||
  userMessage.includes("number") ||
  userMessage.includes("queue") ||
  userMessage.includes("mera number") ||
  userMessage.includes("meri turn")
) {
  const userQueue = await Queue.findOne({
    patientId: userId,
    status: { $in: ["waiting", "missed"] },
  }).sort({ createdAt: -1 }); // ✅ latest queue

  if (!userQueue) {
    reply = "Aapka koi active token nahi hai.";
  } 
  
  else if (userQueue.status === "missed") {
    reply =
      "Aapki turn miss ho gayi hai 😕. Kripya reception se contact karein.";
  } 
  
  else {
    const current = await Queue.findOne({
      doctorId: userQueue.doctorId,
      status: "in-progress",
    });

    // current token safe
    const currentToken = current?.tokenNumber || 0;

    let peopleAhead = userQueue.tokenNumber - currentToken - 1;
    if (peopleAhead < 0) peopleAhead = 0;

    if (!current) {
      reply = `Aapka token ${userQueue.tokenNumber} hai. Queue abhi start nahi hui hai ⏳.`;
    } else {
      reply = `Aapka token ${userQueue.tokenNumber} hai. Aapse pehle ${peopleAhead} log hain.`;
    }
  }
}

// GREETING
else if (
  userMessage.includes("hi") ||
  userMessage.includes("hello") ||
  userMessage.includes("hey")
) {
  reply =
    "Hello 👋 Main aapki madad kar sakta hoon:\n- Token status\n- Queue position\n- Appointment info";
}

//  response
res.json({ success: true, reply });


} catch (err) {
console.log("CHATBOT ERROR:", err.message);

```
res.status(500).json({
  success: false,
  message: "Chatbot error",
});
```

}
};
