"use strict";

const request = require("supertest");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 50000,
    equity: 0,
    company_handle: "c1",
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {   title: "new",
      salary: 50000,
      equity: "0",
      company_handle: "c1"}
    });
  });


  test("no auth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 50000
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 50000,
          equity: 10,
          company_handle: "c1"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
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
          ]
    });
  });




  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});



  /************************************** GET /jobs with filter*/

  describe("GET /jobs with filter", function () {
  
    // Testing a title filter
    test("works: title filter", async function () {
      const resp = await request(app).get("/jobs").send({title:"3"});
      expect(resp.body).toEqual({
        jobs:
            [
              
              {
                title: "Manager3",
                salary: 30000,
                equity: "0.3",
                company_handle: 'c3'
              },
            ],
      });
    });



         // Testing a minSalary filter
    test("works: minSalary filter", async function () {
      const resp = await request(app).get("/jobs").send({minSalary:25000});
      expect(resp.body).toEqual({
        jobs:
            [
              
              {
                title: "Manager3",
                salary: 30000,
                equity: "0.3",
                company_handle: 'c3'
              },
            ],
      });
    });



    // Testing a hasEquity filter
    test("works: hasEquity filter", async function () {
      const resp = await request(app).get("/jobs").send({hasEquity:true});
      expect(resp.body).toEqual({
        jobs:
            [
              
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
            ],
      });
    });



    // Testing a all filters
    test("works: all filters", async function () {
      const resp = await request(app).get("/jobs").send({title:"2",minSalary:15000,hasEquity:true});
      expect(resp.body).toEqual({
        jobs:
            [
              
              {
                title: "Manager2",
                salary: 20000,
                equity: "0.2",
                company_handle: 'c2'
               }
            ],
      });
    });


       // Invalid JSON
       test("doesn't work: invalid JSON", async function () {
        const resp = await request(app).get("/jobs").send({title123:"c"});

        expect(resp.statusCode).toEqual(400);

        expect(resp.body).toEqual({"error": {"message": ["instance additionalProperty \"title123\" exists in instance when not allowed"], "status": 400}});


      });





      


    });
  

  
  
  
  
  
  
    

//   });

/************************************** GET /jobs/:title */

describe("GET /jobs/:title", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/Manager1`);
    expect(resp.body).toEqual({
      job: {
        title: "Manager1",
        salary: 10000,
        equity: "0.1",
        company_handle: 'c1'
      }
    });
  });

  // test("works for anon: company w/o jobs", async function () {
  //   const resp = await request(app).get(`/companies/c2`);
  //   expect(resp.body).toEqual({
  //     company: {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     },
  //   });
  // });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:title */

describe("PATCH /companies/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/Manager1`)
        .send({
          title: "Manager1New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        title: "Manager1New",
        salary: 10000,
        equity: "0.1",
        company_handle: 'c1'
      },
    });
  });

  test("unauth for non-admin user", async function () {
    const resp = await request(app)
        .patch(`/jobs/Manager1`)
        .send({
          title: "Manager1New",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });


  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/Manager1`)
        .send({
          title: "Manager1New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/job/nope`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on company handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/Manager1`)
        .send({
          company_handle: "c1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/Manager1`)
        .send({
          equity: 10,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:title */

describe("DELETE /jobs/:title", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/Manager1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "Manager1" });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/Manager1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/jobs/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
