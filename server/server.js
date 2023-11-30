const express=require("express");
const bodyParser=require('body-parser');
// const router = require("./routes/places-routes");
const PlacesRoutes=require("./routes/places-routes");
const UserRouters=require("./routes/users-routes")
const HttpError=require('./models/Http-error');
const { default: mongoose } = require("mongoose");



const app =express()
app.use(bodyParser.json())

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin,X-Requested-with,Content-Type,Accept,Authorization');
        res.setHeader('Access-Control-Allow-methods','GET,POST,PATCH,DELETE')
})
app.use('/api/places',PlacesRoutes)
app.use('/api/users',UserRouters)

app.use((req,res,next)=>{
    const error=new HttpError('Could not find this route',404)
    throw error
})

app.use((error,req,res,next)=>{
    if(res.headerSent){
        return next(error)
    }
    res.status(error.code ||500)
    res.json({message:error.message ||'An unknown error occured!'})
})

port=6000

mongoose
.connect('mongodb+srv://projplaces:projplaces@cluster0.vcht0kp.mongodb.net/mern?retryWrites=true&w=majority')
.then(()=>{
    app.listen(port,()=>{
        console.log(`server is listening on port ${port}`);
    }) 
})
.catch(err=>{
    console.log(err);
})

