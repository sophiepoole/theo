const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app.js");

const should = chai.should();
chai.use(chaiHttp);

describe("Schedule", () => {
  ["repeated", "one-off"].forEach( (key) => {

    describe(`/POST empty ${key} schedule`, () => {
      it(`should create an empty ${key} schedule`, (done) => {
        var data = {"schedule": []};
        if (key === "one-off") {
          data["startDate"] = null;
        }
        const validateResult = (res) => {
          res.should.have.status(200);
          res.body.schedule.should.be.a("array");
          res.body.schedule.length.should.be.eql(0);
          if (key === "one-off") {
            chai.assert(res.body.startDate === null);
          }
        };
        chai.request(app)
            .post(`/schedule/${key}`)
            .send(data)
            .end((err, res) => {
              validateResult(res);
            });
        chai.request(app)
            .get(`/schedule/${key}`)
            .end((err, res) => {
              validateResult(res);
              done();
            });
        });
    });

  });
});
