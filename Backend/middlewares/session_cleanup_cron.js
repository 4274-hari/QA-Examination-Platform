const cron = require("node-cron");
const SessionClean = require("../controllers/schedule_controllers/sessioncleaner_controllers");
const deleteSchedules = require('../controllers/schedule_controllers/scheduledelete_controllers');

cron.schedule("*/1 * * * *", async () => {
  await SessionClean();
});

cron.schedule("0 0 * * *", async () => {
  await deleteSchedules();
});



module.exports = cron;
