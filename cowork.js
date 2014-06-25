
var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

io.set('origins','*lindneo.com*:*');
io.set('log level', -1);
//io.set('heartbeat timeout', 200000);
//io.set('heartbeat interval', 20000);

function get_random_color() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}


try {
  //app.listen(1881,{ log: false });
  app.listen(1881);
} catch (err) {
 console.log(err);
 return;
} 

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
       res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}


function userList(pageId){
  try {
   var newUserList={};
    for (var prop in users)
    { 
      if (users[prop].pageid==pageId){
        newUserList[prop]=users[prop];
      }
    }
    return newUserList;
  } catch (err) {
   console.log(err);
   return;
  } 
}

function size (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function bookUserList(bookId){
  try {
    var newBookUserList={};
    for (var prop in users)
    { 
      if (users[prop].bookid==bookId){
        newBookUserList[prop]=users[prop];
      }
    }
    return newBookUserList;
  } catch (err) {
   console.log(err);
   return;
  } 
}


function ChatSend(line,socket){
  try {
    var  response={
      line:line,
      user: users[socket.id]
    };
    console.log(users[socket.id].name +": "+line);
    io.sockets.in(users[socket.id].bookid ).emit('chatBroadcast', response);
   } catch (err) {
     console.log(err);
     return;
  } 
}

function makeItSelected(componentId,socket){

  if ( typeof (users[socket.id] ) === "undefined") { console.log("Fault in makeItSelected"); return socket.disconnect();}
  try {
    var  select_item={
        componentId:componentId,
        user: users[socket.id]
      };
  
  socket.broadcast.to(users[socket.id].pageid ).emit('emitSelectedComponent', select_item);
  } catch (err) {
     console.log(err);
     return;
  } 
}

var loggedInUsers = {};

var users=[];

io.sockets.on('connection', function (socket) {
  socket.on('logged_in', function (data) { 
    
    console.log('Loggedin Emit for sid and user'+data.sid+" "+data.username);

    if(loggedInUsers[data.username])  { 
      console.log('Same user exists'+data.sid+" "+data.username);
      
      if(data.sid!=loggedInUsers[data.username].sid){
        console.log('Same user exists but different Session! Logout !'+data.sid+" "+data.username);
        var count = 0;
        loggedInUsers[data.username].sockets.forEach(function(socks) { 
          console.log('Kick' + (++count));
          socks.emit("logout");
        });
        data.sockets= [];
        data.sockets.push(socket);
        loggedInUsers[data.username]=data;  
      } else {
        loggedInUsers[data.username].sockets.push(socket);
        console.log('Same user exists but same Session! No Problem !'+data.sid+" "+data.username);
      }
    }else {
      data.sockets= [];
      data.sockets.push(socket);
      loggedInUsers[data.username]=data;  
    }
  });

  socket.on('changePage', function (data) {

    try {
      //if ( typeof (users[socket.id] ) != "undefined")
        if(users[socket.id])  { 
               socket.leave(users[socket.id].pageid );      
               socket.leave(users[socket.id].bookid );      
        }

      if(data){
        data.color=get_random_color();
        users[socket.id]=data;
        socket.join(data.pageid);
        socket.join(data.bookid);
          
        var newUserList=userList(data.pageid);
        console.log('In page ' + data.pageid + ' now ' + size(newUserList) +'users exists');
        io.sockets.in( users[socket.id].pageid ).emit('userListUpdate',newUserList);

        var newBookUserList=bookUserList(users[socket.id].bookid);
        console.log('In book ' + data.bookid + ' now ' + size(newBookUserList) +'users exists');
        io.sockets.in( users[socket.id].bookid ).emit('userBookListUpdate',newBookUserList);
      }
    } catch (err) {
       console.log(err);
       return;
    } 
  });

  socket.on('newComponent', function (component) {
    if ( typeof (users[socket.id] ) === "undefined") { console.log("Fault in newComponent "); return socket.disconnect();}
    try {
      console.log('page_id:'+users[socket.id].pageid);
      socket.broadcast.to( users[socket.id].pageid ).emit('newComponent', component);


      socket.broadcast.to( users[socket.id].bookid ).emit('pagePreviewUpdate', users[socket.id].pageid );
    } catch (err) {
       console.log(err);
       return;
    } 
  });
 
  socket.on('updateComponent', function (component) {
    if ( typeof (users[socket.id] ) === "undefined") { console.log("Fault in updateComponent"); return socket.disconnect();}
    try {
      console.log('Component Updated page_id:'+users[socket.id].pageid);
      socket.broadcast.to( users[socket.id].pageid ).emit('updateComponent', component);
      socket.broadcast.to( users[socket.id].bookid ).emit('pagePreviewUpdate', users[socket.id].pageid );
      makeItSelected(component.id,socket);
     } catch (err) {
       console.log(err);
       return;
    } 

  });


  socket.on('destroyComponent', function (componentId) {
    if ( typeof (users[socket.id] ) === "undefined") { console.log("Fault in destroyComponent"); return socket.disconnect();}
    try {
      console.log('page_id:'+users[socket.id].pageid);
      socket.broadcast.to( users[socket.id].pageid ).emit('destroyComponent', componentId);
      socket.broadcast.to( users[socket.id].bookid ).emit('pagePreviewUpdate', users[socket.id].pageid );
    } catch (err) {
       console.log(err);
       return;
    } 
  });

  socket.on('destroyPage', function () {

    if ( typeof (users[socket.id] ) === "undefined") { console.log("Fault in destroyPage"); return socket.disconnect();}
    try {
      console.log("Delete Page from book with id " + users[socket.id].bookid);
      socket.broadcast.to( users[socket.id].bookid ).emit('destroyPage');
    } catch (err) {
     console.log(err);
     return;
    } 
  });

  socket.on('createPage', function () {
    if ( typeof (users[socket.id] ) === "undefined") { console.log("Fault in createPage "); return socket.disconnect();}
    try {
      console.log("New Page to book with id " + users[socket.id].bookid);
      socket.broadcast.to( users[socket.id].bookid ).emit('createPage');
    } catch (err) {
     console.log(err);
     return;
    } 
  });

	socket.on('emitSelectedComponent', function (componentId) {
    makeItSelected(componentId,socket);

	});

  socket.on('chatBroadcast', function (line) {
    ChatSend(line,socket);
  });

  socket.on('disconnect', function() {
    try {
      console.log('disconnect');
      if(users[socket.id])  { 
        var pageid = users[socket.id].pageid;
        var bookid = users[socket.id].bookid;
        delete users[socket.id];
        var newUserList=userList(pageid);
        var newBookUserList=bookUserList(bookid);        
        io.sockets.in( pageid ).emit('userListUpdate',newUserList);
        io.sockets.in( bookid ).emit('userBookListUpdate',newBookUserList);
      }
    } catch (err) {
      console.log(err);
      return;
    } 
  });


});
  
