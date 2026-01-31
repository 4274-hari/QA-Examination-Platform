const {getDb} = require('../../config/db');

async function addHandleForm(req,res) {

    try {

        const db = getDb();

        const collection = db.collection("qa_form");

        const {regulation,academic_year} = req.body;

         if (
      (!Array.isArray(regulation) || regulation.length === 0) &&
      (!Array.isArray(academic_year) || academic_year.length === 0)
    ) {
      return res.status(400).json({
        message: "No valid data provided"
      });
    }

        if(Array.isArray(regulation) && regulation.length > 0){

              await collection.updateOne(
        { regulation: { $exists: true } },
        {
          $addToSet: {
            regulation: { $each: regulation }
          }
        },
        { upsert: true }
      );
            
        }

        if(Array.isArray(academic_year) && academic_year.length > 0){

            await collection.updateOne(
        { academic_year: { $exists: true } },
        {
          $addToSet: {
            academic_year: { $each: academic_year }
          }
        },
        { upsert: true }
      );

        }

         return res.status(200).json({
      success: true,
      message: "Added successfully"
    });
        
    } catch (error) {

        console.error(error);

        return res.status(500).json({success: false,message: "Internal server error"});

    }
    
}


async function deleteHandleForm(req, res) {
  try {
    const db = getDb();
    const collection = db.collection("qa_form");

    const { regulation, academic_year } = req.body;

    if (
      (!Array.isArray(regulation) || regulation.length === 0) &&
      (!Array.isArray(academic_year) || academic_year.length === 0)
    ) {
      return res.status(400).json({
        message: "No valid data provided"
      });
    }

    if (Array.isArray(regulation) && regulation.length > 0) {
      await collection.updateOne(
        { regulation: { $exists: true } },
        {
          $pull: {
            regulation: { $in: regulation }
          }
        }
      );
    }

    if (Array.isArray(academic_year) && academic_year.length > 0) {
      await collection.updateOne(
        { academic_year: { $exists: true } },
        {
          $pull: {
            academic_year: { $in: academic_year }
          }
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Data deleted successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

module.exports = {addHandleForm,deleteHandleForm}