import express from 'express';
import session from 'express-session';
import {v4 as uuidv4} from 'uuid';
import os from "os";            

const app = express();
const PORT = 3500;

//miIP: 10.10.62.30
//ipAdrian: 10.10.62.17
//ipMatias:  10.10.62.14

//ipIdai: 10.10.62.17
//ipAilton: 10.10.62.13


//Sesiones almacenadas en Memoria(RAM)
const sessions = {};

app.use(express.json())
app.use(express.urlencoded({extended: true }));

// Middleware
app.use(express.json());
app.use(
  session({
    secret: 'P4-MARH#palabraelegida-SesionesHTTP-VariablesDeSesion', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 5*60*1000, secure:false}, 
  })
);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

app.get('/', (request, response)=>{
    return response.status(200).json({message: "Bienevenid@ al API de Control de Sesiones",
                                      author:"M.T.I. Marco A. Ramírez Hdez."})
})
  

// Helper function to calculate inactivity
const calculateInactiveTime = (lastActivity) => {
  const now = Date.now();
  return Math.floor((now - lastActivity) / 1000); // In seconds
};

//Helper Datos de Red
const getServerNetworkInfo = () => {
    const interfaces = os.networkInterfaces();
    for(const name in interfaces){
        for(const iface of interfaces[name]){
            if(iface.family === 'IPv4' && !iface.internal){
                return { serverIp: iface.address, serverMac: iface.mac};
            }
        }
    }
}


// Login endpoint
app.post('/login' , (request , response)=>{
    const{email,nickname, macAddress}= request.body;

    if(!email || !nickname || !macAddress){
        return response.status(400).json({message: "Se esperan campos requeridos"})
    }

    const sessionId = uuidv4();
    const now = new Date();

    sessions[sessionId] ={
        sessionId,
        email,
        nickname,
        macAddress,
        ip : getServerNetworkInfo(),
        createAt: now ,
        lastAccess: now
    };


    response.status(200).json({
        message : "Se ha logeado de manera exitosa",
        sessionId,
    });
}) ;

// Session status endpoint
app.get("/session-status", (request, response) => {
    const sessionId = request.query.sessionId;
    console.log(request.query.sessionId);


    if (!sessionId || !sessions[sessionId]) {
      return response.status(404).json({ message: "No hay sesiones activas" }); // Add return here
    }
  
    response.status(200).json({
      message: "Sesion Activa",
      session: sessions[sessionId],
    });
  });


// Logout endpoint
app.post('/logout', (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send({ message: 'Error logging out.' });
      }
      res.send({ message: 'Logged out successfully.' });
    });
  } else {
    res.status(400).send({ message: 'No active session to log out.' });
  }
});

// Update endpoint
app.put('/update', (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ message: "No hay sesiones activas" }); 
  }

  sessions[sessionId].lastAccess = new Date();
  res.send({ message: 'La sesión se actualizó correctamente.', session: req.session.user });
});



// Check activity endpoint
app.get('/check-activity', (req, res) => {
  if (!req.session.user) {
    return res.status(401).send({ message: 'You need to log in first.' });
  }

  const inactiveTime = calculateInactiveTime(req.session.user.lastActivity);

  if (inactiveTime > 60) {
    return res.status(403).send({ message: 'Session expired due to inactivity.' });
  }

  req.session.user.lastActivity = Date.now();
  res.send({ message: 'Session is active.', inactiveTime });
});

