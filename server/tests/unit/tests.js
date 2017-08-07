const Sequelize = require("sequelize");
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    logging: false
});

sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../../../bin/www');
let should = chai.should();

chai.use(chaiHttp);

let newUser = {
    username: "Redux",
    password: '123456',
    confirmPassword: '123456',
    email: 'test@email.com',
    first_name: 'React',
    last_name: 'Reduxstagram',
    bio: "testing"
}

let dupeUsername = {
    username: "Redux",
    password: '123456',
    confirmPassword: '123456',
    email: 'test@dupeusername.com',
    first_name: 'React',
    last_name: 'Reduxstagram',
    bio: "testing"
}


// Register a user

describe('Not register when a field is empty: ', () => {
    it('it should not register a user if the username/passwords/email/names fields are empty', (done) => {
        let emptyUser = {
            username: "Redux",
            password: '123456',
            confirmPassword: '123456',
            email: '',
            first_name: 'React',
            last_name: '',
            bio: "testing"
        }
        chai.request('http://localhost:3000')
            .post('/api/register')
            .send(emptyUser)
            .end((err, res) => {
                res.should.have.status(500);
                res.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('message').eql('Please fill out all fields')
                done();
            });
    });
});

describe('Not register when passwords dont match: ', () => {
    it('it should not register a user if the password fields dont match', (done) => {
        let emptyUser = {
            username: 'Redux',
            password: '123456',
            confirmPassword: '12345',
            email: 'test@passwords.com',
            first_name: 'React',
            last_name: 'Reduxstagram',
            bio: "testing"
        };
        chai.request('http://localhost:3000')
            .post('/api/register')
            .send(emptyUser)
            .end((err, res) => {
                res.should.have.status(500);
                res.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('message').eql('Passwords do not match')
                done();
            });
    });
});

describe('Register user: ', () => {
    before((done) => {
        sequelize.sync({ force: true });
        done();
    });

    after((done) => {
        sequelize.sync({ force: true });
        done();
    });

    it('it should register a user', (done) => {
        chai.request('http://localhost:3000')
            .post('/api/register')
            .send(newUser)
            .end((err, res) => {
                res.should.have.status(200);
                res.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('message').eql('Successfully Registered')
                done();
            });
    });
});

describe('Not register a user if email or username is in use: ', () => {
    beforeEach((done) => {
        chai.request('http://localhost:3000')
            .post('/api/register')
            .send(newUser)
            .end((err) => {
                done();
            })
    });

    afterEach((done) => {
        sequelize.sync({ force: true }).then(() => {
            done();
        });
    });

    it('it should not register a user if the requested email address is already in use', (done) => {
        chai.request('http://localhost:3000')
            .post('/api/register')
            .send(newUser)
            .end((err, res) => {
                res.should.have.status(500);
                res.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('message').eql('This email address is already in use')
                done();
            })
    })

    it('it should not register a user if the requested username is already in use', (done) => {
        chai.request('http://localhost:3000')
            .post('/api/register')
            .send(dupeUsername)
            .end((err, res) => {
                res.should.have.status(500);
                res.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('message').eql('This username is already in use')
                done();
            })
    })
});

// Login and Logout

describe('Login User: ', () => {
    it('it should login a user if the correct credentials are sent', (done) => {
        before((done) => {
            chai.request('http://localhost:3000')
                .post('/api/register')
                .send(newUser)
                .end((err) => {
                    done();
                })
        });

        after((done) => {
            chai.request('http://localhost:3000')
                .post('/api/logout')
                .end((err) => {
                    done();
                })
        });

        chai.request('http://localhost:3000')
            .post('/api/login')
            .send({
                username: 'Redux',
                password: '123456'
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('message').eql('Login Successful')
                done();
            })
    });
});

describe('Dont Login User: ', () => {
    it('it should not login a user if incorrect credentials are sent', (done) => {
        chai.request('http://localhost:3000')
            .post('/api/login')
            .send({
                username: 'React',
                password: '1234567'
            })
            .end((err, res) => {
                res.should.have.status(404);
                res.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('message').eql('User not found')
                done();
            })
    });
});

describe('Logout User: ', () => {
    it('it should logout a user', (done) => {
        before((done) => {
            chai.request('http://localhost:3000')
                .post('/api/register')
                .send(newUser).then(() => {
                    chai.request('http://localhost:3000')
                        .post('/api/login')
                        .send({
                            username: 'Redux',
                            password: '123456'
                        })
                })
                .end((err) => {
                    done();
                })
        });


        chai.request('http://localhost:3000')
            .post('/api/logout')
            .end((err, res) => {
                res.should.have.status(200);
                res.should.be.a('object');
                res.body.should.have.property('message');
                res.body.should.have.property('message').eql('You are successfully logged out')
                done();
            })
    });
});

describe('Get User Data: ', () => {
    before((done) => {
        sequelize.sync({ force: true }).then(() => {
            require('../../seeds/users')();
            require('../../seeds/photos')();
            require('../../seeds/comments')();
            done();
        })

    })
    it('should get the data of a user give their user id if they are registered', (done) => {
        let testId = "03df81c0-5b56-46bf-ba5f-b78607ecf86f";

        chai.request('http://localhost:3000')
            .get('/api/user/' + testId)
            .end((err, res) => {
                res.should.have.status(200);
                res.should.be.a('object');
                res.body.should.have.property('userId').eql(testId);
                res.body.should.have.property('photos');
                res.body.should.have.property('comments');
                done();
            })
    })
})


