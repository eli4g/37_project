const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  // Extract the data that is to be updated
  const keys = Object.keys(dataToUpdate);

  
  
  // If the the keys object does not have any length (there is no data), throw and error that there is "No data"
  if (keys.length === 0){

    throw new BadRequestError("No data");

  } 

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  // Map the columns from the date provided to the columns of the database for the fields that are being updated
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // Return the column names, comma separated, along with the values being updated
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
