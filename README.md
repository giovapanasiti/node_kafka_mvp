# py_event_driven_kafka_mvp

1. Start the Conduktor app
`follow README.md in conduktor/`

2. Start ar/main.py in a terminal
`cd ar`
`npm install`
`node main.py`

3. Start ar/subscriber.py in a terminal
`cd ar`
`npm install`
`node subscriber.py`

4. Make a POST request to http://localhost:9000/data with a JSON body like this:
`{
    "message": "Hello World!"
}`