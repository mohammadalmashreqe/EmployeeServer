


let express = require('express')
let app = express();
let http = require('http');
let server = http.Server(app);
var ticketsList = new Array();
let socketIO = require('socket.io');
let io = socketIO(server);
var amqp = require('amqplib/callback_api');
/**
 *Port number 
 *
 */
const port = process.env.PORT || 4001;

/**
 *code run in start up of server 
 *
 */

    try {
        amqp.connect('amqp://localhost', function (error0, connection) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }
                var exchange = 'logs';

                channel.assertExchange(exchange, 'fanout', {
                    durable: false
                });

                channel.assertQueue('', {
                    exclusive: true
                }, function (error2, q) {
                    if (error2) {
                        throw error2;
                    }
                    console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
                    channel.bindQueue(q.queue, exchange, '');

                    channel.consume(q.queue, function (msg) {
                        if (msg.content) {
                           ticketsList=JSON.parse(msg.content.toString());

                            console.log(" [x] %s", msg.content.toString());
                            io.emit("UpadteList",msg.content.toString());

                        }
                    }, {
                            noAck: true
                        });
                });
            });
        });
    }
    catch (err) {
        console.log(err);
    }


    //send the current List to connected devices 
    io.on('connection', function(socket){
        try {
        io.emit("UpadteList",JSON.stringify(ticketsList));
        }
        catch(err)
        {
            console.log(err);
        }
      });


/**
 *code run in whene the employee served customer  
 *
 */

app.get("/serveTickets", (req, res) => {
    try {
        amqp.connect('amqp://localhost', function (error0, connection) {
            if (error0) {
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }
                var exchange = 'logs';ticketsList.splice(0,1);
                var msg = JSON.stringify(ticketsList);

                channel.assertExchange(exchange, 'fanout', {
                    durable: false
                });
                channel.publish(exchange, '', Buffer.from(msg));
                console.log(" [x] Sent %s", JSON.stringify(ticketsList));
                io.emit("UpadteList",msg);

            });

      
        });
        res.send("Done");

    }
    catch(err)
    {
        console.log(err);
        res.send("Fiald");

    }

});


server.listen(port, () => {
    try {
        console.log(`started on port: ${port}`);


    }
    catch (err) {
        console.log(err);
    }
});










































