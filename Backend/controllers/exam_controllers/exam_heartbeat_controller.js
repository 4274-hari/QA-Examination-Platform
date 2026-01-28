const { getDb } = require("../../config/db");

async function heartbeat(req, res) {
  const db = getDb();
  const sessionCol = db.collection("qa_exam_sessions");

  const { registerno } = req.session.user;

  const session = await sessionCol.findOne({ registerno });

  if (!session) {
    return res.status(403).json({ status: "TERMINATED" });
  }

  if (session.status === "TERMINATED") {
    return res.status(403).json({
      status: "TERMINATED",
      reason: session.terminatedReason
    });
  }

  if (session.status === "PAUSED") {
    return res.status(409).json({
      status: "PAUSED",
      reason: "Session paused"
    });
  }

  if (session.status === "COMPLETED") {
    return res.status(200).json({
      status: "COMPLETED",
      message: "Exam already completed"
    });
  }

  // 🔒 MULTIPLE TAB DETECTION (HERE)
//   if (
//     session.lastSeenAt &&
//     Date.now() - new Date(session.lastSeenAt).getTime() < 1000
//   ) {
//     await sessionCol.updateOne(
//       { _id: session._id },
//       {
//         $set: {
//           status: "TERMINATED",
//           terminatedReason: "MULTIPLE_TAB_DETECTED",
//           endedAt: new Date()
//         }
//       }
//     );

//     return res.status(403).json({
//       status: "MULTIPLE_TAB_DETECTED"
//     });
//   }

  const HEARTBEAT_TIMEOUT = 120 * 1000; // 120 seconds

  if (
    session.lastSeenAt &&
    Date.now() - new Date(session.lastSeenAt).getTime() > HEARTBEAT_TIMEOUT &&
    session.status === "ACTIVE"
  ) {
    await sessionCol.updateOne(
      { _id: session._id },
      {
        $set: {
          status: "PAUSED",
          isOnline: false,
          "offline.lastDisconnectedAt": new Date()
        }
      }
    );

    return res.status(409).json({
      status: "PAUSED",
      reason: "Heartbeat timeout"
    });
  }

  await sessionCol.updateOne(
    { registerno },
    {
      $set: {
        lastSeenAt: new Date()
      }
    }
  );

  res.json({ success: true });
}

async function ping(req, res) {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.json({ 
    ok: true, 
    timestamp: Date.now(),
    serverLoad: process.memoryUsage().heapUsed / 1024 / 1024, 
    uptime: process.uptime() 
  });
}

module.exports = { heartbeat, ping }