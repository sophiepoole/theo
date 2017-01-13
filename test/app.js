const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app.js");

const should = chai.should();
chai.use(chaiHttp);

const Scheduler = require("../Scheduler.js");
const moment = require('moment');

["repeated", "one-off"].forEach( (key) => {

  describe(`${key} schedule`, () => {

    beforeEach((done) => {
      var data = {"schedule": []};

      chai.request(app)
          .post("/schedule/repeated")
          .send(data)
          .end( (err, res) => {
            data["startDate"] = null;

            chai.request(app)
                .post("/schedule/one-off")
                .send(data)
                .end( (err, res) => {
                  done();
                });
          });
    });

    describe(`/POST empty schedule`, () => {
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

              chai.request(app)
                  .get(`/schedule/${key}`)
                  .end((err, res) => {
                    validateResult(res);

                    chai.request(app)
                        .get("/schedule/one-off/is-active")
                        .end((err, res) => {
                          res.should.have.status(200);
                          chai.assert(res.body.isActive === false);

                          chai.request(app)
                              .get("/scheduled-temperature-now")
                              .end((err, res) => {
                                res.should.have.status(200);
                                chai.assert(res.body.temperature === null);
                                done();
                              });
                        });
                  });
            });
      });
    });

    describe(`/POST active schedule`, () => {
      const temperature = 12.3;
      it(`should create an active ${key} schedule`, (done) => {
        var data = {"schedule": [
          {"start": moment().subtract(1, 'minute')
                            .format(Scheduler.timeFormat),
           "end":   moment().add(2, 'minute')
                            .format(Scheduler.timeFormat),
           "temperature": temperature}
        ]};
        if (key === "one-off") {
          data["startDate"] = moment().format(Scheduler.dateFormat);
        }

        const validateResult = (res) => {
          res.should.have.status(200);
          res.body.schedule.should.be.a("array");
          if (key === "one-off") {
            chai.assert(res.body.startDate != null);
          }
        };

        chai.request(app)
            .post(`/schedule/${key}`)
            .send(data)
            .end((err, res) => {
              validateResult(res);

              chai.request(app)
                  .get(`/schedule/${key}`)
                  .end((err, res) => {
                    validateResult(res);

                    chai.request(app)
                        .get("/schedule/one-off/is-active")
                        .end((err, res) => {
                          res.should.have.status(200);
                          chai.assert(res.body.isActive === (key === "one-off"));
                          chai.request(app)
                              .get("/scheduled-temperature-now")
                              .end((err, res) => {
                                res.should.have.status(200);
                                chai.assert(res.body.temperature === temperature);
                                done();
                              });
                        });
                  });
            });
        });
    });

  });
});
