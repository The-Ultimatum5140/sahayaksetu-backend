import Queue from "../models/QueueModel.js";

export const chatbotReply = async (req, res) => {
  try {
    const { message } = req.body;

    // ✅ safe + clean message
    const userMessage = message?.toLowerCase().trim() || "";
    const userId = req.userId;

    let reply = "Sorry, samajh nahi aaya 😅";

    // 🔥 TOKEN / QUEUE QUERY HANDLER
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
      });

      if (!userQueue) {
        reply = "Aapka koi active token nahi hai.";
      } else {
        const current = await Queue.findOne({
          doctorId: userQueue.doctorId,
          status: "in-progress",
        });

        const currentToken = current ? current.tokenNumber : 0;

        let peopleAhead = userQueue.tokenNumber - currentToken - 1;

        if (peopleAhead < 0) peopleAhead = 0;

        reply = `Aapka token ${userQueue.tokenNumber} hai. Aapse pehle ${peopleAhead} log hain.`;
      }
    }

    //  GREETING HANDLER (extra polish)
    else if (
      userMessage.includes("hi") ||
      userMessage.includes("hello") ||
      userMessage.includes("hey")
    ) {
      reply = "Hello 👋 kaise help kar sakta hoon?";
    }

    //  DEFAULT
    res.json({ success: true, reply });
  } catch (err) {
    console.log("CHATBOT ERROR:", err.message);
    res.json({ success: false, message: err.message });
  }
};
