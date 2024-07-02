const express = require("express");
const { Client } = require("pg");
const cors = require("cors");
const bodyparser = require("body-parser");
const config = require("./config");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyparser.json());

var conString = config.urlConnection;
var client = new Client(conString);
client.connect(function (err) {
  if (err) {
    return console.error("Não foi possível conectar ao banco.", err);
  }
  client.query("SELECT NOW()", function (err, result) {
    if (err) {
      return console.error("Erro ao executar a query.", err);
    }
    console.log(result.rows[0]);
  });
});



app.get("/", (req, res) => {
  console.log("Response ok.");
  res.send("API NBA Jogadores - Servidor disponível.");
});

// Obter todos os jogadores
app.get("/jogadores", (req, res) => {
    client.query("SELECT * FROM jogadores", (err, result) => {
        if (err) {
            console.error("Erro ao executar a query de SELECT", err);
            res.status(500).send("Erro ao recuperar jogadores.");
        } else {
            res.status(200).json(result.rows);
        }
    });
});

// Obter jogador por pick
app.get("/jogadores/:pick", (req, res) => {
    const pick = req.params.pick;
    client.query("SELECT * FROM jogadores WHERE pick = $1", [pick], (err, result) => {
        if (err) {
            console.error("Erro ao executar a query de SELECT por pick", err);
            res.status(500).send("Erro ao recuperar jogador.");
        } else {
            if (result.rows.length === 0) {
                res.status(404).send(`Jogador com pick ${pick} não encontrado.`);
            } else {
                res.status(200).json(result.rows[0]);
            }
        }
    });
});

// Criar novo jogador
app.post("/jogadores", (req, res) => {
    const { pick, team, player, position, country, height, weight } = req.body;
    client.query(
        "INSERT INTO jogadores (pick, team, player, position, country, height, weight) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [pick, team, player, position, country, height, weight],
        (err, result) => {
            if (err) {
                console.error("Erro ao executar a query de INSERT", err);
                res.status(500).send("Erro ao criar jogador.");
            } else {
                res.status(201).json(result.rows[0]);
            }
        }
    );
});

// Atualizar jogador por pick
app.put("/jogadores/:pick", (req, res) => {
    const pick = req.params.pick;
    const { team, player, position, country, height, weight } = req.body;
    client.query(
        "UPDATE jogadores SET team=$1, player=$2, position=$3, country=$4, height=$5, weight=$6 WHERE pick=$7",
        [team, player, position, country, height, weight, pick],
        (err, result) => {
            if (err) {
                console.error("Erro ao executar a query de UPDATE", err);
                res.status(500).send(`Erro ao atualizar jogador com pick ${pick}.`);
            } else {
                res.status(200).send(`Jogador com pick ${pick} atualizado.`);
            }
        }
    );
});

// Deletar jogador por pick
app.delete("/jogadores/:pick", (req, res) => {
    const pick = req.params.pick;
    client.query("DELETE FROM jogadores WHERE pick = $1", [pick], (err, result) => {
        if (err) {
            console.error("Erro ao executar a query de DELETE", err);
            res.status(500).send(`Erro ao deletar jogador com pick ${pick}.`);
        } else {
            if (result.rowCount === 0) {
                res.status(404).send(`Jogador com pick ${pick} não encontrado.`);
            } else {
                res.status(200).send(`Jogador com pick ${pick} deletado.`);
            }
        }
    });
});

//listen precisa ser a última função da API.
app.listen(config.port, () =>
  console.log("Servidor funcionando na porta " + config.port)
);

module.exports = app;