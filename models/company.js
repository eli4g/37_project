"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }



  /**Filter on the companies list based on specific criteria
   * 
   * Can contain any or all of the following filter criteria:
   * name (case insensitive), minEmployees, maxEmployees
   * 
   * 
   * Returns list of companies in the filter results
   * 
   * 
   * 
   */

  static async filter(filterData){

    // Set the columns and filter indeces to be used for the where clause

    const keys = Object.keys(filterData);
    const values = Object.values(filterData);


   




  let whereFilter = "";
  let whereValues = [];


  // Loop through the keys array to generate the where clause fields and value array
  for (const [index, value] of keys.entries()){

    let whereOperator = "";
    let whereIndex = "";
    let colName = "";
    let whereValue = "";





      if(value == "name"){
        
        colName = "LOWER(name)";
        whereOperator = "like";
        whereValue = `%${values[index]}%`;
        whereIndex = `LOWER($${index + 1})`;


      }else if(value == "minEmployees"){
        
        colName = "num_employees";
        whereOperator = ">=";
        whereValue = values[index];
        whereIndex = `$${index + 1}`;

      }else if(value == "maxEmployees"){  
        
        colName = "num_employees";
        whereOperator = "<=";
        whereValue = values[index];
        whereIndex = `$${index + 1}`;
      }


      

      whereFilter = whereFilter + ` ${colName} ${whereOperator} ${whereIndex} and `;
      whereValues.push(whereValue);

  };






  // Find the the last 'and' in the where clause string and remove it

  const pos = whereFilter.lastIndexOf(' and');
  whereFilter = whereFilter.substring(0,pos);




    
    

  // Run the query and set the result to the companyRes variable

  const companyRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
       FROM companies
       WHERE ${whereFilter}`, whereValues
    );

   


    return companyRes.rows;

  };






  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);


    const jobRes = await db.query(
      `SELECT title,
      salary,
      equity,
      company_handle
      FROM jobs
      WHERE company_handle = $1
            `,[handle]
    )

     
    // let invoiceObj = {invoices: invResults.rows};
    
    //    let finalResults = results.rows[0];

      
    //    Object.assign(finalResults, invoiceObj);

    let jobObj = {jobs: jobRes.rows}


    Object.assign(company, jobObj);


   


    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
