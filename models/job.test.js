"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    //title, salary, equity, company_handle
    title: "Manager4",
    salary: 40000,
    equity: .4,
    company_handle: 'c1'
  };

  test("works", async function () {
    let job = await Job.create(newJob);
   

    const result = await db.query(
          `SELECT title, salary, equity :: DECIMAL equity, company_handle
           FROM jobs
           WHERE title = 'Manager4'`);

           console.log(result.rows);


    
    expect(result.rows).toEqual([
      {
        title: "Manager4",
        salary: 40000,
        equity: "0.4",
        company_handle: 'c1'
      }]
    );
  });


});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "Manager1",
        salary: 10000,
        equity: "0.1",
        company_handle: 'c1'
      },
      {
        title: "Manager2",
        salary: 20000,
        equity: "0.2",
        company_handle: 'c2'
      },
      {
        title: "Manager3",
        salary: 30000,
        equity: "0.3",
        company_handle: 'c3'
      },
    ]);
  });
});


 

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("Manager1");
    expect(job).toEqual({
      title: "Manager1",
      salary: 10000,
      equity: "0.1",
      company_handle: 'c1'
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


/*************************get - using filter */

describe("get/filter", function(){

  test("works: title filter", async function () {

    let filterData = {	
      title: "1"
       }
    let jobs = await Job.filter(filterData);
    expect(jobs).toEqual([
      {
        title: "Manager1",
        salary: 10000,
        equity: "0.1",
        company_handle: 'c1'
      }
    ]);
  });


  test("works: minSalary filter", async function () {

    let filterData = {	
      minSalary: 25000
       }
       let jobs = await Job.filter(filterData);
       expect(jobs).toEqual([
      {
        title: "Manager3",
        salary: 30000,
        equity: "0.3",
        company_handle: 'c3'
      }
    ]);
  });


  test("works: hasEquity filter", async function () {

    let filterData = {	
      hasEquity: true
       }
    let jobs = await Job.filter(filterData);
       expect(jobs).toEqual([
      {
        title: "Manager1",
        salary: 10000,
        equity: "0.1",
        company_handle: 'c1'
      }
    ,
      {
        title: "Manager2",
        salary: 20000,
        equity: "0.2",
        company_handle: 'c2'
       }
    ,
      {
        title: "Manager3",
        salary: 30000,
        equity: "0.3",
        company_handle: 'c3'
      }
    ]);
  });

  test("works: all filters", async function () {

    let filterData = {	
      title: "2",
      minSalary: 15000,
      hasEquity: true
       }
       let jobs = await Job.filter(filterData);
       expect(jobs).toEqual([
        {
          title: "Manager2",
          salary: 20000,
          equity: "0.2",
          company_handle: 'c2'
         }
    ]);
  });




});








/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 9999,
    equity: .123,
    
  };

  test("works", async function () {
    let job = await Job.update("Manager1", updateData);
   

    const result = await db.query(
          `SELECT  title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'New'`);
    expect(result.rows).toEqual([{
      title: "New",
      salary: 9999,
      equity: "0.123",
      company_handle: 'c1'
    }]);
  });



  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("Manager2", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("Manager2");
    const res = await db.query(
        "SELECT title FROM jobs WHERE title='Manager2'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
