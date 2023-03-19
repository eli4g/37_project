"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");


const { BadRequestError,ExpressError } = require("../expressError");
const { ensureLoggedIn ,ensureAdmin} = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterSchema = require("../schemas/jobFilter.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companyFilterSchema = require("../schemas/companyFilter.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be {  title, salary, equity, company_handle }
 *
 * Returns {  title, salary, equity, company_handle }
 *
 * Authorization required: login
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ {  title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * 
 * 
 * title: filter by job title. Like before, this should be a case-insensitive, matches-any-part-of-string search.
 * minSalary: filter to jobs with at least that salary.
 * hasEquity: if true, filter to jobs that provide a non-zero amount of equity. If false or not included in the filtering, list all jobs regardless of equity.
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {

    
    // Validate the JSON format in the request, to make sure it complies with the format for a filter query
    const validator = jsonschema.validate(req.body, jobFilterSchema);


    // If the JSON request format is not correct or the fields are invalid, throw a new BadRequestError
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    
    // Else, if there are any valid filter parameters in the request, 
    else if(Object.keys(req.body).length > 0 ){

   

        const jobs = await Job.filter(req.body);

        return res.json({ jobs });
      

    }


    

    //If there are no filters, respond with all the companies


    const jobs = await Job.findAll();
    return res.json({ jobs });


  } catch (err) {
    return next(err);
  }
});

/** GET /[title]  =>  { job }
 *
 *  Job is {  title, salary, equity, company_handle }
 *   where jobs is [{  title, salary, equity, company_handle }, ...]
 *
 * Authorization required: none
 */

router.get("/:title", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.title);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});






/** PATCH /[title] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns {   title, salary, equity, company_handle  }
 *
 * Authorization required: admin
 */

router.patch("/:title", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.title, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[title]  =>  { deleted: title }
 *
 * Authorization: admin
 */

router.delete("/:title", ensureAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.title);
    return res.json({ deleted: req.params.title });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
