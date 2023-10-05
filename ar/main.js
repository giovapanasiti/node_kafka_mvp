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

// const pool = new pg.Pool({
//   user: 'user',
//   host: 'postgres',
//   database: 'dmzdb',
//   password: 'password',
// });

// Endpoint to receive JSON data
app.post('/data', async (req, res) => {
  // const client = await pool.connect();
  try {

    // get timestamp
    const timestamp = new Date().toISOString();

    // const { data_json, text_version } = req.body;
    // const query = 'INSERT INTO submissions(data_json, created_at, updated_at, text_version) VALUES($1, NOW(), NOW(), $2) RETURNING *';
    // const values = [data_json, text_version];
    // const result = await client.query(query, values);
    await producer.connect();
    // Once insert is done, produce a message to Kafka
    await producer.send({
      topic: 'sub_received',
      key: timestamp,
      messages: [{ value: JSON.stringify(req.body) }],
    });

    console.log('Data received and sent to Kafka.')

    res.status(200).send('Data received and saved.');
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
      const data = JSON.parse(message.value.toString());
      console.log('Received message from Kafka sub_akn:')
      console.log(data)
      // Update the database with the received message (details need to be more specific based on actual requirements)
      // Placeholder update query as example
      // const query = 'UPDATE submissions SET updated_at = NOW() WHERE id = $1';
      // const values = [data.id];
      // await pool.query(query, values);
    },
  });
};

runConsumer();

app.listen(port, () => {
  console.log(`DMZ App listening at http://localhost:${port}`);
});

