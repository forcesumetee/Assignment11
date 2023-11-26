const express = require('express');
const app = express();
const fs = require('fs');
const hostname = 'localhost';
const port = 3000;
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const multer = require('multer');
const path = require('path');
const { resolve } = require('path');
const { rejects } = require('assert');

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'img/');
    },

    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  });

  const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

//ทำให้สมบูรณ์
app.post('/profilepic', (req,res) => 
{
    let upload = multer({ storage: storage, fileFilter: imageFilter }).single('avatar'); //multer เป็นโมเดลที่ใช้ในการหาที่อยู่
    upload(req, res, (err) => {
        if (req.fileValidationError) //file แตก
        {
            return res.send(req.fileValidationError) 
        }
        else if (!req.file) //ไม่มี file
        {
            return res.send('Please select an image')
        }
        else if (err instanceof multer.MulterError) //error ของตัวmulter 
        {
            return res.send(err);
        }
        else if (err) {
            return res.send(err);
        }
        updateImg(req.cookies.username,req.file.filename); //ถ้าไม่มีอะไร error ก็ไปทำฟังก์ชั่นถัดไป
        res.cookie('img',req.file.filename);//ค่าของ cookie
        return res.redirect('feed.html')
    });
})

//ทำให้สมบูรณ์
// ถ้าต้องการจะลบ cookie ให้ใช้
app.get('/logout', (req,res) => {
    res.clearCookie('username');
    res.clearCookie('img');
    return res.redirect('index.html');
})

//ทำให้สมบูรณ์
app.get('/readPost', async (req,res) => 
{
    var readdata = await readJson('js/postDB.json');
    res.end(readdata);
})

//ทำให้สมบูรณ์
app.post('/writePost',async (req,res) => 
{
    var readdata = await readJson('js/postDB.json');
    var writedata = writeJson(readdata,req.body,'js/postDB.json');
    res.end(JSON.stringify(writedata));
})

//ทำให้สมบูรณ์
app.post('/checkLogin',async (req,res) => 
{
    // ถ้าเช็คแล้ว username และ password ถูกต้อง
    // return res.redirect('feed.html');
    // ถ้าเช็คแล้ว username และ password ไม่ถูกต้อง
    
    var readdata = await readJson('js/userDB.json');
    var data = JSON.parse(readdata);
    var key = Object.keys(data); //กำหนดคีย์
    for(var data_new = 0 ; data_new<key.length;data_new++)
    {
        if(req.body.username == data[key[data_new]].username && req.body.password == data[key[data_new]].password )//เช็คว่าตัวชื่อผู้ใช้ตรงกันหรือเปล่า
        {
            res.cookie('username',data[key[data_new]].username)
            res.cookie('img',data[key[data_new]].img)
            return res.redirect('feed.html');
        }
    }
     if(req.body.username == data[key[data_new]].username || req.body.password == data[key[data_new]].password)
    {
        return res.redirect('index.html?error=1') //if else แบบย่อ
    }

})

//ทำให้สมบูรณ์
const readJson = (file_name) => 
{
    return new Promise((resolve,rejects)=>
    {
        fs.readFile(file_name,'utf8',(err,data)=>
        {
            if(err)
            {
                rejects(err);
            }
            else
            {
                resolve(data);
            }
        })
    })
}

//ทำให้สมบูรณ์
const writeJson = (o_data,n_data,file_name) => 
{
    return new Promise((resolve,rejects)=>
    {
        var post_DB = JSON.parse(o_data);
        var DB_keys = Object.keys(post_DB);
        var postIndex = "post" + (DB_keys.length + 1).toString();
        var newData = JSON.parse(JSON.stringify(n_data));
        post_DB[postIndex] = newData;
        var data = JSON.stringify(post_DB);
        fs.writeFile(file_name, data , (err) => {
        if (err) 
        {
            rejects(err);
        }
        else
        {
            var o_data = JSON.parse(data)
        }
        resolve(JSON.stringify(o_data, null, "\t"))
        });
    })
}

//ทำให้สมบูรณ์
const updateImg = async (username, fileimg) => 
{
    var data = await readJson("js/userDB.json");
    return new Promise((resolve, rejects) => {
    var data_origin = JSON.parse(data);
    var key = Object.keys(data_origin); //กำหนดคีย์
    for(var data_new = 0 ; data_new<key.length;data_new++)
    {
        if(username == data_origin[key[data_new]].username)//เช็คว่าตัวชื่อผู้ใช้ตรงกันหรือเปล่า
        {
            console.log(data_origin[key[data_new]].img);
            console.log(fileimg);
            data_origin[key[data_new]].img = fileimg; //บรรทัดแห่งการเปลี่ยนรูป
            var data_new = JSON.stringify(data_origin);
            fs.writeFile("js/userDB.json",data_new,(err) => {
                if (err) 
                    reject(err);
                else
                {
                    var z = JSON.parse(data_new)
                }
                resolve(JSON.stringify(z, null, "\t"))
            })
            break;
        }
    }
    })
}

 app.listen(port, hostname, () => {
        console.log(`Server running at   http://${hostname}:${port}/`);
});
