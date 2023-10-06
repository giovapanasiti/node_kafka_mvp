const { Kafka } = require('kafkajs');

const kafka = new Kafka({ clientId: 'kafka_subscriber', brokers: ['0.0.0.0:9092'] });

const consumer = kafka.consumer({ groupId: 'kafka_subscriber' });

console.log('SUBSCRIBER')

const runConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'sub_received'});

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());


      // Send data to function get_my_data
      const result = get_my_data(data);

      console.log('Processed Data:', result)

      // Produce the result back to Kafka on topic sub_akn
      const producer = kafka.producer();
      await producer.connect();
      // Givce the result back to Kafka      
      await producer.send({
        topic: 'sub_akn',
        messages: [{ value: JSON.stringify(result) }],
      });
      await producer.disconnect();
    },
  });
};

runConsumer();

function get_my_data(data) {
  // Placeholder function as its details aren't provided
  return data;
}
