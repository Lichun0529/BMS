//[搭建路由模块] 1. 创建一个登录和注册的路由器
//[搭建路由模块] 2. 路由器中引入express模块
const express = require('express');
//使用bcrypt模块加密数据
const bcrypt = require('bcrypt');
//头像生成模块
const gravatar = require('gravatar')
//使用jwt模块生成token
const jwt = require('jsonwebtoken');
const User = require('../../models/users');
const keys = require('../../config/keys');
//使用passport验证
const passport = require('passport');
//[搭建路由模块] 3. 实例化Router
const router = express.Router();
//[搭建路由模块] 4. 定义路由
router.get('/test',(req,res)=>{
    res.json({
        msg:'OK'
    })
})

//[搭建注册接口] 3. 路由模块中添加POST方法监听
// route POST api/users/register
// @desc 
// @access public
router.post('/register',(req,res)=>{
    console.log(req.body);
    //[搭建注册接口] 4.查询数据库中是否已经存在邮箱账户
    User.findOne({email:req.body.email}).then(user=>{
        if(user){
            return res.status(400).json({email:'已被注册'})
        }else{
            let avatar = gravatar.url(req.body.email, {s: '200', r: 'pg', d: 'mm'});
            let newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
                avatar
            })
            let url = gravatar.url(req.body.email, {s: '200', r: 'pg', d: 'mm'});
            //加密密码
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash( newUser.password, salt, function(err, hash) {
                    newUser.password = hash;
                    //[创建数据模型] 6. 保存到数据库
                    newUser.save()
                    .then(user=>{
                        res.status(400).json(user)
                    })
                    .catch(err=>{
                        if (err) return console.error(err);
                    })
                }); 
            });
            
        }
    })
})
//[搭建登录接口] 3. 路由模块中添加POST方法监听
// route POST api/users/register
// @desc 
// @access public
router.post('/login',(req,res)=>{
    User.findOne({email:req.body.email}).then(data =>{
        if(!data) return res.status(404).json({email:'账户不存在'})
        //密码验证
        bcrypt.compare(req.body.password, data.password)
            .then((isMatch)=> {
                if(isMatch){
                    let rules = {id:data.id,name:data.name};
                    jwt.sign(rules,keys.secretOrKeys,{expiresIn:3600},(err,token)=>{
                        if(err) throw err;
                        //Bearer+空格：passport验证方式的固定token格式
                        res.json({
                            success:true,
                            token:'Bearer '+token
                        })
                    })
                }else{
                    res.json({password:'密码错误'})
                }
            })
            .catch(err=>{
                console.log(err);
            })
    })
    
})

// route POST api/users/current
// @desc return current user
// @access private
//[验证token] 4.搭建一个获取用户信息的接口并设置验证方式
//[验证token] 5.使用passport验证token是否有效
router.get('/current',passport.authenticate('jwt',{session:false}),(req,res)=>{
    res.json({
        id:req.user.id,
        name:req.user.name,
        email:req.user.email,
    })
})


//[搭建路由模块] 5. 导出路由器
module.exports = router