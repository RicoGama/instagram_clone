var express = require('express'),
    bodyParser = require('body-parser'),
    multiparty = require('connect-multiparty'),
    mongodb = require('mongodb'),
    objectdId = require('mongodb').ObjectId
    fs = require('fs');

var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multiparty());

var port = 8080;

app.listen(port);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
);

console.log('Servidor HTTP está escutando na porta ' + port);

app.get('/', function (req, res) {
    res.send({msg: 'Olá'});
});

app.post('/api', function (req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');

    var date = new Date();
    var timestamp = date.getTime();

    var url_imagem = timestamp + '_' + req.files.arquivo.originalFilename;

    var pathOrigem = req.files.arquivo.path;
    var pathDestino = './uploads/' + url_imagem;

    fs.rename(pathOrigem, pathDestino, function (err) {
        if (err) {
            res.status(500).json({error: err});
            return;
        } 

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        };

        db.open(function (err, mongoclient) {
            mongoclient.collection('postagens', function (err, collection) {
                collection.insert(dados, function (err, records) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json({status: 'inclusão realizada com sucesso'});
                    }
    
                    mongoclient.close();
                });
            });
        });

    });
});

app.get('/api', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find().toArray(function (err, results) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(results);
                }

                mongoclient.close();
            });
        });
    });
});

app.get('/imagens/:imagem', function (req, res) {
    var img = req.params.imagem;
    
    fs.readFile('./uploads/' + img, function (err, content) {
        if (err) {
            res.status(400).send(err);
            return;
        }
        res.writeHead(200, {'content-type' : 'image/jpg'});
        res.end(content);
    });
});

app.get('/api/:id', function (req, res) {

    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.find(objectdId(req.params.id)).toArray(function (err, results) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(results);
                }

                mongoclient.close();
            });
        });
    });


});


app.put('/api/:id', function (req, res) {

    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.update(
                {_id: objectdId(req.params.id)},
                {$set: {titulo : req.body.titulo}},
                {},
                function (err, records) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(records);
                    }

                    mongoclient.close();
                }
            );
        });
    });


});

app.delete('/api/:id', function (req, res) {

    db.open(function (err, mongoclient) {
        mongoclient.collection('postagens', function (err, collection) {
            collection.remove({_id: objectdId(req.params.id)}, function (err, records) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(records);
                }

                mongoclient.close();
            });
        });
    });


});