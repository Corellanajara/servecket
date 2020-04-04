const server = require('http').createServer();
const io = require('socket.io')(server);
var os = require('os');
const { exec } = require("child_process");
const readline = require("readline");
const os_utils 	= require('os-utils');
var request = require("request");
var fs = require('fs');
var login = [];
var idUsuario = "No es un usuario real ni autenticado";
fs.readFile('conf.txt','utf8', function(err, contents) {
    var partes = contents.split('\n');
    var usuario = ["user","pass","port"];
    var login = [];
    for(var i = 0 ; i < partes.length;i++){
	     var parte = partes[i];
	      var contenido = parte.split("=")[1];
	      login.push(contenido);
        if(i == partes.length -1){
          iniciar(login);
        }
    }
    console.log("pido iniciar");
    console.log(login);
});

function iniciar(l){
  console.log("login",l);
  var obj = {
      "correo": "asfa"+l[0],
      "clave": "asfa"+l[1]
    }
  console.log("obj",obj);
  request.post({
        "headers": { "content-type": "application/json" },
        "url": "http://178.128.71.20:8080/auth/",
        "body": JSON.stringify({
            "correo": l[0],
            "clave": l[1]
        })
    }, (error, response, body) => {
        var resultado = JSON.parse(body);
        if(error) {
            return console.dir(error);
        }
        if(resultado){
          console.log("body",resultado);
          idUsuario = resultado.userId;
          console.log("id del usuario traido",idUsuario);
          console.log("id del usuario traido",resultado.userId);
          server.listen(l[2]);
        }else {
          console.log("body",resultado.length);
          throw "no pudo inicializarse correctamente";
        }
    });
}

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

