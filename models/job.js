"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns {  title, salary, equity, company_handle }
   *.
   * */

  static async create({ title, salary, equity, company_handle }) {
  


    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle`,
        [
          title, salary, equity, company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{   title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT title,
                  salary,
                  equity,
                  company_handle 
           FROM jobs
           ORDER BY title`);
    return jobsRes.rows;
  }



  /**Filter on the jobs list based on specific criteria
   * 
   * Can contain any or all of the following filter criteria:
   * title (case insensitive), minSalary, hasEquity
   * 
   * 
   * Returns list of jobs in the filter results
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





      if(value == "title"){
        
        colName = "LOWER(title)";
        whereOperator = "like";
        whereValue = `%${values[index]}%`;
        whereIndex = `LOWER($${index + 1})`;


      }else if(value == "minSalary"){
        
        colName = "salary";
        whereOperator = ">=";
        whereValue = values[index];
        whereIndex = `$${index + 1}`;

      }else if(value == "hasEquity" && values[index] == true){  
        
        colName = "equity";
        whereOperator = ">";
        whereValue = 0;
        whereIndex = `$${index + 1}`;
      }


      

      whereFilter = whereFilter + ` ${colName} ${whereOperator} ${whereIndex} and `;
      whereValues.push(whereValue);

  };






  // Find the the last 'and' in the where clause string and remove it

  const pos = whereFilter.lastIndexOf(' and');
  whereFilter = whereFilter.substring(0,pos);




    
    

  // Run the query and set the result to the jobRes variable

  const jobRes = await db.query(
      `SELECT title,
      salary,
      equity,
      company_handle
      
      FROM jobs
      WHERE ${whereFilter}`, whereValues
      
    );

   


    return jobRes.rows;

  };




  /** Given a job title, return data about job.
   *
   * Returns { title, salary, equity, company_handle }
   *   where jobs is [{ title, salary, equity, company_handle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(title) {
    const jobRes = await db.query(
          `SELECT title,
                  salary,
                  equity,
                  company_handle 
           FROM jobs
           
           WHERE title = $1`,
        [title]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(title, data) {
    const { setCols, values } = sqlForPartialUpdate(data,{});
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE title = ${handleVarIdx} 
                      RETURNING title,
                                salary,
                                equity,
                                company_handle  
                               `;
    const result = await db.query(querySql, [...values, title]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(title) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE title = $1
           RETURNING title`,
        [title]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${title}`);
  }
}


module.exports = Job;
