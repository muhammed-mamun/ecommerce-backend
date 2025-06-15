// server.ts
import express from "express";
import cookieParser from "cookie-parser";
const app = express();
const PORT = 3000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser()); 

app.get("/", (req, res) => {
  res.send("Server is started");
});

//*Routes file
import routes from './routes/index.ts'
app.use(routes)

app.use((req, res) => {
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}`);
});
 
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
  console.log(`http://localhost:${PORT}`)
});