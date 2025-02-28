const express = require("express");
const session = require("express-session");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(error => {
    if (error) {
        console.error("Erro ao conectar ao banco de dados" + error);
        return;
    }
    console.log("Conectado ao banco de dados!");
});

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

const authenticateSession = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).send("Acessa negado, faça login para continuar");
    }
    next();
}

app.post("/login", (req, res) => {
    const { cpf, senha } = req.body;
    db.query("SELECT* FROM usuarios WHERE cpf = ?", [cpf], async (err, results) => {
        if (err) return res.status(500).send("server com erro");
        if (results.length === 0) return res.send(500).send("CPF ou senha incorretos");
        const usuario = results[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) return res.status(500).send("CPF ou senha incorretos")
        req.session.userId - usuario.idUsuarios;
        console.log("idUsuarios:", usuario.idUsuarios);
        res.json({ message: "Login bem-sucedido" });

    });
})

app.post('/cadastro', async(req, res )=> {
    const { nome, email, cpf, senha, celular, cep, logradouro, bairro, cidade, estado, imagem, Tipos_Usuarios_idTipos_Usuarios } = req.body;

    cep = cep.replace(/-/g, '');

    db.query(
        'SELECT cpf FROM usuarios WHERE cpf =?', [cpf], async (err, results) => {
            if (err) {
                console.error('Erro ao consultar o CPF:', err);
                return res.status(500).json({ message: 'Erro ao verificar o CPF' })
            }

            if (results.length > 0) {
                return res.status(400).json({ messade: 'CPF já cadastrado.' });
            }
            const senhacripto = await bcrypt.hash(senha, 10);
            //priemiro argumento é variavel a ser cripto
            //segundo argumento é o custo do hash

            db.query('INSERT INTO usuarios(nome, email, cpf, senha, celular, cep, logradouro, bairro, cidade, estado, Tipos_Usuarios_idTipos_Usuarios, imagem) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'),
            [nome, email, cpf, senhacripto, celular, cep, logradouro, bairro, cidade, estado, Tipos_Usuarios_idTipos_Usuarios, imagem ], (err, results) =>{
                if (err){
                    console.error('Erro ao inserir usuário', err);
                    return res.status(500).json({message:'Erro ao cadastrar usuário.'})
                }
                console.log('Usuário inserido com sucesso:', results.idUsuarios);
                res.status(200).json({message: 'Usuário cadastrado com sucesso!'});
            };

        }
    );
});

app.use(express.static('/src'));
app.use(express.static(__dirname +'/src'));

app.get('/login', (req, res) =>{
    res.sendFile(__dirname + '/src/login.html');
})

app.get('/cadastro', (req, res) =>{
    res.sendFile(__dirname + '/src/cadastroUsuarios.html');
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta:${PORT}`));
