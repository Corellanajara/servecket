const server = require('http').createServer();
const io = require('socket.io')(server);
var os = require('os');
const { exec } = require("child_process");

var segundos = 3000;
io.on('connection', client => {
  client.on('event', data => {
        console.log(data);
        console.log("es un evento dentro de la conexion");
  });
  var intervalo = setInterval(function(){
    client.emit('cpu',{data : os.cpus()});
    client.emit('totalmem',{data :os.totalmem()});
    client.emit('freemem',{data : os.freemem()});
  }, segundos );
  client.on('setTiempo',data=>{
    console.log(data);
    segundos = data.segundos;
    clearInterval(intervalo);
    intervalo = setInterval(function(){
      client.emit('cpu',{data : os.cpus()});
      client.emit('totalmem',{data :os.totalmem()});
      client.emit('freemem',{data : os.freemem()});
    }, segundos );
  })
  client.on('ejecutar', data=>{
   console.log(data);
//   data = data || "ls";/
//	console.log(data);
    exec(data, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        client.emit('res',{res:stdout});
    });
  })
  client.on('disconnect', () => {
      console.log("se fue el cliente");
  });
});
server.listen(5000);

