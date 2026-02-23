const cron = require("node-cron");
const SessionClean = require("../controllers/schedule_controllers/sessioncleaner_controller");
const deleteSchedules = require('../controllers/schedule_controllers/scheduledelete_controller');
const {activateExam }= require('../controllers/code_controllers/code_generator_controller');

cron.schedule("*/1 * * * *", async () => {
  await SessionClean();
  await deleteSchedules();
  await activateExam();
});


module.exports = cron;
