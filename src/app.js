import express from "express"
import __dirname from "./utils.js";
import productsRouter from "./routes/products.router.js"
import mChatRouter from "./routes/mChat.router.js"
import productsManager from "./Managers/productManager.js"
import ChatManager from "./Managers/chatManager.js";
import { Server } from "socket.io";
import containerSQL from "./Container/containerSQL.js"
import sqliteOptions from "./dbs/knex.js";
import { generateProduct } from "./Managers/productFaker.js";
const app = express();
app.use(express.static(__dirname+"/public"));
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.set("views",__dirname+"/public");
app.set("view engine","ejs");
app.get("/",async(req,res)=>{
    res.render("index")
});
const productsService = new productsManager();
app.use("/api/productos",productsRouter);
app.use("/",mChatRouter)
const server = app.listen(8080, ()=>console.log("Escuchando"))
const io = new Server(server);

const productSQL = new containerSQL(sqliteOptions, "products")
const messagesSQL = new containerSQL(sqliteOptions, "messages")
const messages = []
app.get("/productos",async(req,res)=>{
    let productos = await productSQL.getAll();
res.render("productos",
{
    productos
}
)
});

app.get("/chat",(req,res)=>{
    res.render("chat");
})
const chatService = new ChatManager();
io.on("connection", async socket=>{
    let productos = await productSQL.getAll()
    socket.emit("productos", await productSQL.getAll())

    socket.on("message", async data=>{
        await messagesSQL.addProduct(data);
        const messagesC = await messagesSQL.getAll();
        io.emit("logs",messagesC);
    })
    socket.emit("logs", await messagesSQL.getAll());
    socket.on("authenticated",data=>{
        socket.broadcast.emit("newUserConnected", data);
    })
})
