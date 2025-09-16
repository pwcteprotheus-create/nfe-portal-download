require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');

console.log('Iniciando Portal NFe...');

const app = express();

// Porta Render ou 3000 local
const PORT = process.env.PORT || 3000;

// Pasta downloads
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Modo de operação: MOCK
const MODE = process.env.MODE || 'MOCK';

// Logs e parser
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend
app.use(express.static(path.join(__dirname, 'public')));

// Função para gerar XMLs MOCK
function sampleXml(chave) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe${chave}" versao="4.00">
      <ide><cNF>00000000</cNF></ide>
      <emit><CNPJ>00000000000191</CNPJ><xNome>Fornecedor Exemplo</xNome></emit>
      <dest><CNPJ>00000000000272</CNPJ><xNome>Cliente Exemplo</xNome></dest>
      <det>
        <prod><cProd>ABC123</cProd><xProd>Produto Exemplo</xProd><vProd>100.00</vProd></prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>`;
}

// Função para baixar XMLs MOCK
async function baixarTodosXMLs() {
  try {
    for (let i = 1; i <= 5; i++) {
      const chave = String(10000000000000000000000000000000000000000000 + i).slice(-44);
      const xml = sampleXml(chave);
      fs.writeFileSync(path.join(DOWNLOAD_DIR, `${chave}.xml`), xml);
    }
    return { ok: true, message: 'Download concluído.' };
  } catch (err) {
    console.error('Erro:', err.message);
    return { ok: false, error: err.message };
  }
}

// Endpoint download
app.get('/api/download-all', async (req, res) => {
  const result = await baixarTodosXMLs();
  res.json(result);
});

// Health check
app.get('/api/ping', (req, res) => res.json({ ok: true, mode: MODE }));

// Rota default para frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Portal NFe rodando na porta ${PORT} — MODE=${MODE}`);
});
