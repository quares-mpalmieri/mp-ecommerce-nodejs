var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
const mercadopago = require ('mercadopago');// SDK de Mercado Pago
var path = require('path');
var bodyParser = require('body-parser');
const fs = require('fs');

var port = process.env.PORT || 3000
const BASE_URL ='https://q-mpalmieri-mp-commerce-nodejs.herokuapp.com/';

const testSeller = {
    collector_id: 469485398,
    publicKey: 'APP_USR-7eb0138a-189f-4bec-87d1-c0504ead5626',
    accessToken: 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398'
};
const testBuyer = {
    id: 471923173,
    email: 'test_user_63274575@testuser.com',
    password: 'qatest2417'
};

// Agrega credenciales
mercadopago.configure({
    access_token: testSeller.accessToken,
  });

//BodyParse config
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


  app.post('/checkout', (req, res) => {
    console.log("aa =>", req.body);
    const { price, unit, title, img } = req.body;
    
  // Crea un objeto de preferencia
    let preference = {
        items: [
        {
            id:  1234,
            title: title,
            unit_price: Number(price),
            quantity: Number(unit),
            picture_url: path.join(BASE_URL + img ),
            description: "Dispositivo móvil de Tienda e-commerce"
        }
        ],
        payer: {
            name: 'Lalo',
            surname: "Landa",
            email: testBuyer.email,
            phone: {
                area_code: "11",
                number: 22223333
            },
            address: {
                street_name: 'False',
                street_number: 123,
                zip_code: "1111"
            }
        },
        external_reference: "mpalmieri@quaresitsolutions.com",
        payment_methods: {
            excluded_payment_methods: [{
                "id": "amex"
            }],
            excluded_payment_types: [{
                "id": "atm"
            }],
            installments: 6
        },
        back_urls: {
            success: BASE_URL + 'success',
            pending: BASE_URL + 'pending',
            failure: BASE_URL + 'failure'
        },
        auto_return: "approved",
        notification_url: BASE_URL + 'notificacion',
    };

  mercadopago.preferences.create(preference)
  .then(function(response){
  // Este valor reemplazará el string "<%= global.id %>" en tu HTML
    global.id = response.body.id;
    res.redirect(response.body.init_point);
  }).catch(function(error){
    console.log(error);
  });

});


app.get('/success', function (req, res) {
    //console.log(req.query);
    if (req.query.payment_id) {
        res.render('respuesta', {
            titulo: "Aprobado",
            mensaje: "Gracias por su compra",
            payment_info: {
                payment_id: req.query.payment_id,
                external_reference: req.query.external_reference,
                merchant_order_id: req.query.merchant_order_id
            }
        });
    } else {
        res.redirect("/");
    }
});

app.get('/pending', function (req, res) {
    if (req.query.payment_id) {
        res.render('respuesta', {
            titulo: "Pendiente",
            mensaje: "Su compra esta en estado pendiente",
            payment_info: {
                payment_id: req.query.payment_id,
                external_reference: req.query.external_reference,
                merchant_order_id: req.query.merchant_order_id
            }
        });
    } else {
        res.redirect("/");
    }
});


app.get('/failure', function (req, res) {
    if (req.query.payment_id) {
        res.render('respuesta', {
            titulo: "Rechazado",
            mensaje: "No se pudo realizar la compra",
            payment_info: {
                payment_id: req.query.payment_id,
                external_reference: req.query.external_reference,
                merchant_order_id: req.query.merchant_order_id
            }
        });
    } else {
        res.redirect("/");
    }
});
 
app.post('/notificacion', function (req, res) {
    fs.appendFile('./assets/log.txt', `\n${new Date()} // ${JSON.stringify(req.body)}`, function (err) {
        if (err) throw err;
        console.log('Saved!');
      });
    res.sendStatus(200);
});


app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    res.render('detail', req.query);
});

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.static('assets'));
app.use('/assets', express.static(__dirname + '/assets'));

app.listen(port);