var upstart = require("upstart");
upstart.status("networking", function(err, name, pid, stdout, stderr) {
  console.log("Do we rock and roll?")
  if(err) console.log("Cable broke.", stderr);
  if(err) return; 
  if(pid)
    console.log("Yeah, we do on ", pid);
  else
    console.log("Nah, we don't.")
});
