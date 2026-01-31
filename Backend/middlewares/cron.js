const cron = require("node-cron");
const SessionClean = require("../controllers/schedule_controllers/sessioncleaner_controller");
const deleteSchedules = require('../controllers/schedule_controllers/scheduledelete_controller');
const { ResultStore } = require("../controllers/staff_controllers/result_excel_controller");

cron.schedule("*/1 * * * *", async () => {
  await SessionClean();
});

cron.schedule("*/1 * * * *", async () => {
  await deleteSchedules();
});

cron.schedule("*/1 * * * *", async () => {
  await ResultStore();
});


module.exports = cron;
