const jwt = require("jsonwebtoken");
const { sqlForPartialUpdate } = require("./sql");
const { SECRET_KEY } = require("../config");
const { BadRequestError } = require("../expressError");

describe("sqlPartialUpdate", function () {



  test("works: partial update - all columns", function () {


    const { setCols, values } = sqlForPartialUpdate(
      { firstName: "John", lastName : "Smith", email: "jsmith@gmail.com", isAdmin : false },
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      });
  
    expect(setCols).toEqual('"first_name"=$1, "last_name"=$2, "email"=$3, "is_admin"=$4');

    expect(values).toEqual([ 'John', 'Smith', 'jsmith@gmail.com', false ]);
  });





});
