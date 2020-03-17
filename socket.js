const server = require('http').createServer();
const io = require('socket.io')(server);
var os = require('os');
const { exec } = require("child_process");
const readline = require("readline");
const os_utils 	= require('os-utils');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Dame tu correo ", function(correo) {
    rl.question("Clave ", function(clave) {
        console.log(`${correo}, con clave: ${clave}`);

    });
});

function serviceStatus(client,service){
    exec("service "+service+" status", function(error, stdout){
      if (error) {
          console.log(`error: ${error.message}`);
	  client.emit('res'+service.toUpperCase(),"Servicio no corriendo");
          return;
      }
      var statuspmtatmp = /Active: [a-z]* [\(][a-z]*[\)]/g.exec(stdout.toString())[0];
      client.emit('res'+service.toUpperCase(),statuspmtatmp)
      console.log(statuspmtatmp);
   });
}

//var segundos = 10000;
var segundos = 500;
var segundosServicios = 20000;
io.on('connection', client => {
  serviceStatus(client,"mysql");
  serviceStatus(client,"apache2");
  serviceStatus(client,"cron");
  serviceStatus(client,"sshd");
  client.on('event', data => {
        console.log(data);
        console.log("es un evento dentro de la conexion");
  });
  var intervalo = setInterval(function(){
    client.emit('cpu',{data : os.cpus()});
    client.emit('totalmem',{data :os.totalmem()});
    client.emit('freemem',{data : os.freemem()});
//    serviceMysqlStatus(client);
    os_utils.cpuUsage(function(v){
      client.emit('cpuUsage',{data:v})
    });
    os_utils.cpuFree(function(v){
      client.emit('cpuFree',{data:v})
    });
  }, segundos );
var intervaloServicios = setInterval(function(){
    //serviceMysqlStatus(client);
  serviceStatus(client,"mysql");
  serviceStatus(client,"apache2");
  serviceStatus(client,"cron");
  serviceStatus(client,"sshd");
  }, segundosServicios );
/*  client.on('setTiempo',data=>{
    console.log(data);
    segundos = data.segundos;
    clearInterval(intervalo);
    intervalo = setInterval(function(){
      client.emit('cpu',{data : os.cpus()});
      client.emit('totalmem',{data :os.totalmem()});
      client.emit('freemem',{data : os.freemem()});
    }, segundos );
  })
*/
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
  client.on('notif',dato=>{
   console.log('dato',dato);
  client.emit('notificacionLocal',{red:dato});
  })
  client.on('disconnect', () => {
      console.log("se fue el cliente");
  });
});
server.listen(5000);

