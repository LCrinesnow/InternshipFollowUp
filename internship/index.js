/**
 * Created by rinesnow on 16/3/29.
 */
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var session= require('express-session');
var moment = require('moment');
var authentication = require('./authentication.js');

var app = express();


//连接数据库
var mongoose = require('mongoose');
var models = require('./models/models');

var User = models.User;
var Note = models.Note;

mongoose.connect('mongodb://localhost:27017/notes');
mongoose.connection.on('error',console.error.bind(console,'连接数据库失败!'));

//定义EJS模版引擎和末班文件位置
app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

//定义静态文件目录
app.use(express.static(path.join(__dirname,'public')));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//建立session模型
app.use(session({
    secret:'liuchong',//?
    name:'mynote',
    //一周内免登录
    cookie:{maxAge:1000 * 60 * 60*24*7},//设置session的保存时间为 60min*24小时*7一周
    resave: false,
    saveUnintiallized:true
}));



//添加  页面提示功能
app.use(function(req, res, next) {
    res.locals.user = req.session.user;//???
    var err = req.session.error;//赋值给err变量,
    //var success = req.session.success;//赋值给err变量,

    delete req.session.error;//然后清空session内的数据
    res.locals.message = '';//初始化
    //res.locals.success = '';//初始化

    if (err) {
        //html通过js被操作,在html中用{%-message%}调用
        res.locals.message = '<div class="alert alert-warning">' + err + '</div>';
    }
    //if (success) {
    //    //html通过js被操作,在html中用{%-message%}调用
    //    res.locals.success = '<div class="alert alert-success">' + success + '</div>';
    //}

    next();//?
});



//响应首页get请求
app.get('/',authentication.ifAuthorized);//检测是否登录了
app.get('/',function(req,res){

    Note.find({author:req.session.user.username}).exec(function(err,allNotes){
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        res.render('index',{
           title:'首页',
            user: req.session.user,
            notes:allNotes
        });
    })
});


///注册

//响应注册页面get请求
// app.get('/register',authentication.noReLogin);//不能重复注册了  必须是'/register'因为是针对register的页面的
// app.get('/register',function(req,res){
//    console.log('注册!');
//     res.render('register',{
//         //在跳转页面之前，将user信息数据传入EJS模板。
//         user: req.session.user,
//         title:'注册'
//     });
// });
// //响应注册页面post请求
// app.post('/register',function(req,res){
//     var username = req.body.username,
//        password = req.body.password,
//        passwordRepeat = req.body.passwordRepeat;

//     //检查用户名是否已经存在,如果不存在,则保存该条纪录
   
// });



//登录

//响应登录页面get请求
app.get('/login',authentication.noReLogin);//不能重复登录  //必须是'/login'因为是针对login的页面的
app.get('/login',function(req,res){
   console.log('登录!');
    res.render('login',{
        user: req.session.user,//也要加?
        title:'登录'
    });
});
//响应登录页面post请求
app.post('/login',function(req,res){
    var username = req.body.username, password = req.body.password;
    console.log(username);
    console.log(password);

    User.findOne({username:username},function(err,user){
       if(err){
           console.log(err);
           return res.redirect('/login');
       }
        if(!user){
            req.session.error='用户不存在!';//传到前面的   页面提示功能
            return res.redirect('/login');
        }
        var md5 = crypto.createHash('md5'),
                md5password = md5.update(password).digest('hex');
        if(user.password!==md5password) {
            req.session.error = '用户名或密码不正确';//传到前面的   页面提示功能
            return res.redirect('/login');
        }
        console.log('登录成功!');
        //保存session,可以很方便的通过req参数来存储和访问session对象的数据
        user.password = null;//?
        delete  user.password;
        req.session.user = user;
        //req.session是一个JSON格式的JavaScript对象，我们可以在使用的过程中随意的增加成员。
        return res.redirect('/');
    });
});



//登出
app.get('/quit',function(req,res){
    //退出功能只需将session中的user删除即可。
    req.session.user = null;
    console.log('退出!');
    return res.redirect('/login');
});



//发布

//响应发布get请求
app.get('/post',authentication.ifAuthorized);//检测是否登录了
app.get('/post',function(req,res){
   console.log('发布!');
    res.render('post',{
        user: req.session.user,//也要加?
        title:'发布'
    });
});
//响应发布post请求
app.post('/post',function(req,res){
   var note = new Note({
       title:req.body.title,
       author:req.session.user.username,
       tag: req.body.tag,
       content: req.body.content
   });
    note.save(function(err,doc){
       if(err){
           console.log(err);
           return res.redirect('/post');
       }
        console.log('文章发表成功!')
        return res.redirect('/');
    });
});
//


//博客细节

app.get('/detail/',authentication.ifAuthorized);//检测是否登录了
app.get('/detail/:_id',function(req,res){//:id?
   console.log('查看笔记!');
    Note.findOne({_id:req.params._id}).exec(function(err,art){
        if(err){
            console.log(err);
            return res.redirect('/');
        }
        if(art) {
            res.render('detail', {
                title: '笔记详情',
                user: req.session.user,
                art: art,
                moment:moment
            });
            console.log(art);
        }
    });
});

// app.get('https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx75d11b4f981b1ded&secret=7a915c525f39451f3af19407012459ad&code=CODE&grant_type=authorization_code',function(req,res){

// });//获取appid


app.listen(3000, function(req,res){
    console.log('app is running at port 3000');
});