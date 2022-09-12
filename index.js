const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();


// //middleware
app.use(cors());
app.use(express.json());

//sunsinePro-3
//usBcB6ySbFo5Oucd


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.10o2m.mongodb.net/?retryWrites=true`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: 'Forbidden access' })
      }
      req.decoded = decoded;
      next();
    });
  }






async function run() {
    try {
        await client.connect();
        const chairCollection = client.db('sunsineProject-3').collection('chair');
        const usersCollection = client.db('sunsineProject-3').collection('users');
        const ordersCollection = client.db('sunsineProject-3').collection('orders');

        // // AUTH API
        // app.post('/login', async(req, res) => {
        //     const user = req.body;
        //     const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        //         expiresIn: '1d'
        //     });
        //     res.send({accessToken});
        // })




        // SERVER API
        app.get('/chair', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (email) {
                const query = { email: email };
                const cursor = chairCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else {
                const query = {};
                const cursor = chairCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
        });

        app.get('/chair/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            console.log(id);
            const item = await chairCollection.findOne(query);
            res.send(item);
        });


        // POST
        app.post('/chair', async (req, res) => {
            const newItem = req.body;
            const result = await chairCollection.insertOne(newItem);
            res.send(result);
        });

        // UPDATE
        app.put('/chair/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.totalNewQuantity
                }
            };
            const result = await chairCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });



        app.put('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await usersCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                };
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            // else{
            //   res.status(403).send({message: 'forbidden'});
            // }
        });

        app.get('/users', async (req, res) => {
            console.log("from users")
            // const id = req.params.email;
            // const query = { _id: ObjectId(id) };
            // console.log(id);
            const cursor = await usersCollection.find();
            const item = await cursor.toArray();
            res.send(item);
        });
        
        app.put('/users/:email', async (req, res) => {
            console.log("here")
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        });


        app.patch('/orders/:id', verifyJWT, async(req, res) =>{
            const id  = req.params.id;
            const payment = req.body;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
              $set: {
                paid: true,
                transactionId: payment.transactionId
              }
            }
      
            const result = await paymentCollection.insertOne(payment);
            const updatedBooking = await ordersCollection.updateOne(filter, updatedDoc);
            res.send(updatedBooking);
          })

        // DELETE
        app.delete('/chair/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await chairCollection.deleteOne(query);
            res.send(result);
        });

    }
    finally {

    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Sunsine Project -3');
});

app.listen(port, () => {
    console.log('Listening to port 5000', port);
});
