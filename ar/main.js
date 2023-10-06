const express = require('express');
const pg = require('pg');
const { Kafka } = require('kafkajs');

const app = express();
const port = 9000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Create a new client with Kafka
const kafka = new Kafka({ clientId: 'dmz_app', brokers: ['0.0.0.0:9092'] });

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'dmz_app' });

// Create sqlite3 database
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('dmz_database.db');

// Create a table for storing submissions
db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    text_version TEXT
  )
`);


// Endpoint to receive JSON data
app.post('/data', async (req, res) => {
  // const client = await pool.connect();
  try {

    // get timestamp
    const timestamp = new Date().toISOString();

    const { data_json, text_version } = req.body;
    const query = 'INSERT INTO submissions(data_json, text_version) VALUES(?, ?)';
    
    const values = [JSON.stringify(data_json), text_version];
    const result = await new Promise((resolve, reject) => {
      db.run(query, values, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });

    await producer.connect();
    // Once insert is done, produce a message to Kafka
    await producer.send({
      topic: 'sub_received',
      key: timestamp,
      messages: [{ value: JSON.stringify({ id: result, data: req.body }) }],
    });

    console.log('Data received and sent to Kafka.')

    // res.status(200).send('Data received and saved.');
    res.status(200).send(`Data received and saved: ${JSON.stringify(req.body)}`);
  } catch (error) {
    console.log(error);
    res.status(500).send('Error occurred.');
  } finally {
    // client.release();

  }
});

// Listen for sub_akn topic and update the database
const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'sub_akn', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const data = JSON.parse(message.value.toString());
        const id  = data.id;
        console.log('Received message from Kafka sub_akn: ' + JSON.stringify(data) + ' with id: ' + id);

        // update row in database
        const updateQuery = 'UPDATE submissions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        const updateValues = [id];
        await new Promise((resolve, reject) => {
          db.run(updateQuery, updateValues, function (err) {
            if (err) {
              reject(err);
            } else {
              console.log('Updated row in database with id: ' + id);
              resolve();
            }
          });
        });

        console.log(`Message processed: ${message.value.toString()}`);
      } catch (error) {
        console.log(error);
      }
    }
  });
};

runConsumer();

app.listen(port, () => {
  console.log(`DMZ App listening at http://localhost:${port}`);
});

