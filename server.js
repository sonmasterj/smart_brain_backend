const express=require('express');
const bodyparser=require('body-parser');
const bcrypt=require('bcrypt-nodejs');
const cors=require('cors');
const app=express();
app.use(bodyparser.json());
app.use(cors());
var knex = require('knex');
const db=knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'son',
      password : 'congson',
      database : 'smart_brain'
    }
});
app.get('/',(req,res)=>{
    res.send("it is working");
})
app.post('/signin',(req,res)=>{
    const {email,password}=req.body;
    db.select('email','hash').from('login')
    .where('email','=',email)
    .then(user=>{
        const result=bcrypt.compareSync(password,user[0].hash);
        if(result){
            return db.select('*').from('users')
            .where('email','=',email)
            .then(data=>{
                res.json(data[0]);
            })
            .catch(err=>res.status(400).json('unable to get user'))
        }
        else{
            res.status(400).json('wrong sign in');
        }
    })
    .catch(err=>res.status(400).json('error sign in'))
})
app.post('/register',(req,res)=>{
    const { email, name,password}=req.body;
    const hash=bcrypt.hashSync(password);
    db.transaction(trx=>{
        trx.insert({
            hash:hash,
            email:email
        })
        .into('login')
        .returning('email')
        .then(loginEmail=>{
            return trx('users')
            .returning('*')
            .insert({
                email:loginEmail[0],
                name:name,
                joined: new Date
            })
            .then(user=>res.json(user[0]))
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err=>res.status(400).json('unable to register'))
})
app.get('/profile/:id',(req,res)=>{
    const {id}=req.params;
    db.select().from(users).where({id:id})
    .then(user=>{
        console.log(user[0]);
    })
    .catch(err=>res.status(400).json('no id user found'));
})
app.put('/image',(req,res)=>{ 
    const {id}=req.body;
    db('users')
    .where('id','=',id)
    .increment({
        entries:1
    })
    .returning('entries')
    .then(user=>{
        res.json(user[0]);
    })
    .catch(err=>res.status(400).json('no id found'));
})
app.listen(3001,()=>{
    console.log('app is running');
})