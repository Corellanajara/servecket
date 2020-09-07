const server = require('http').createServer();
const io = require('socket.io')(server);
var os = require('os');
const { exec } = require("child_process");
const readline = require("readline");
const os_utils 	= require('os-utils');
var request = require("request");


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


var idUsuario = "No es un usuario real ni autenticado";
rl.question("Dame tu correo ", function(correo) {
    rl.question("Clave ", function(clave) {
          request.post({
                "headers": { "content-type": "application/json" },
                "url": "http://178.128.71.20:8080/auth/",
                "body": JSON.stringify({
                    "correo": correo,
                    "clave": clave
                })
            }, (error, response, body) => {
                if(error) {
                    return console.dir(error);
                }
                if(body){
                  console.log(typeof(body));
                  var usuario = JSON.parse(body);
                  console.log("body",body);
                  idUsuario = usuario.userId;
                  console.log("id del usuario traido",idUsuario);
                  console.log("id del usuario traido",usuario.userId);
                  rl.question("Super! que puerto uso? R : ", function(puerto) {
                    var texto = "user="+correo;
                    texto += "\npass="+clave;
                    texto += "\nport="+puerto;
                    fs = require('fs');
                    fs.writeFile('docs/conf.txt', texto, function (err) {
                      if (err) return console.log(err);
                      console.log('OK! ahora puedes ejecutar node index.js');
                    });
                    //server.listen(puerto);
                  })

                }else {
                  console.log("body",resultado.length);
                  throw "no pudo inicializarse correctamente";
                }
            });
    });
});

function serviceStatus(client,service){
    exec("service "+service+" status", function(error, stdout){
      if (error) {
	        client.emit('res'+service.toUpperCase(),"0");
          return;
      }
      var statuspmtatmp = /Active: [a-z]* [\(][a-z]*[\)]/g.exec(stdout.toString())[0];
      /*
      PARA CENTOS
      */
      if(service.toUpperCase() == "httpd"){
        service = "apache2";
      }
      if(service.toUpperCase() == "mysqld"){
        service = "mysql";
      }
      /*
      */
      client.emit('res'+service.toUpperCase(),"1")
   });
}

io.on('connection', client => {
  if(client.handshake.query.idUsuario == idUsuario){
    serviceStatus(client,"mysql");
    serviceStatus(client,"mysqld");
    serviceStatus(client,"apache2");
    serviceStatus(client,"httpd");
    serviceStatus(client,"cron");
    serviceStatus(client,"sshd");
  }

  client.on('estadoGrafico',data=>{
//    console.log(idUsuario == data);
    if(data == idUsuario){
      client.emit('cpu',{data : os.cpus()});
      client.emit('totalmem',{data :os.totalmem()});
      client.emit('freemem',{data : os.freemem()});
      os_utils.cpuUsage(function(v){
        client.emit('cpuUsage',{data:v})
      });
      os_utils.cpuFree(function(v){
        client.emit('cpuFree',{data:v})
      });
    }
  })
  client.on('estadoServicios',data=>{

    if(data == idUsuario){
      serviceStatus(client,"mysql");
      serviceStatus(client,"mysqld");
      serviceStatus(client,"apache2");
      serviceStatus(client,"httpd");
      serviceStatus(client,"cron");
      serviceStatus(client,"sshd");
    }

  })
  client.on('ejecutar', data=>{
    exec(data, (error, stdout, stderr) => {
        if (error) {
            return;
        }
        if (stderr) {
            return;
        }
        client.emit('res',{res:stdout});
    });
  })
  client.on('notif',dato=>{
    client.emit('notificacionLocal',{red:dato});
  })
});

//server.listen(4555);

