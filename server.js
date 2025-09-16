require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const morgan = require('morgan');

const app = express();
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MODE = process.env.MODE || 'MOCK'; // MOCK ou PLUGNOTAS
const PLUGNOTAS_APIKEY = process.env.PLUGNOTAS_APIKEY || '';
const PORT = process.env.PORT || 3000;

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR);

// Função MOCK para gerar XMLs de teste
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

// Função para baixar todos XMLs
async function baixarTodosXMLs() {
  console.log('Iniciando download de todos os XMLs...');
  try {
    if (MODE === 'MOCK') {
      // cria 5 XMLs de teste
      for (let i = 1; i <= 5; i++) {
        const chave = String(10000000000000000000000000000000000000000000 + i).slice(-44);
        const xml = sampleXml(chave);
        const filePath = path.join(DOWNLOAD_DIR, `${chave}.xml`);
        fs.writeFileSync(filePath, xml);
        console.log(`XML MOCK salvo: ${filePath}`);
      }
    } else if (MODE === 'PLUGNOTAS') {
      if (!PLUGNOTAS_APIKEY) throw new Error('PLUGNOTAS_APIKEY não configurada no .env');

      // Listar notas (ajustar URL conforme doc PlugNotas)
      const listResp = await axios.get('https://api.plugnotas.com.br/nfe', {
        headers: { 'x-api-key': PLUGNOTAS_APIKEY }
      });

      const notas = listResp.data.notas || [];
      for (let nota of notas) {
        const chave = nota.chave;
        const xmlResp = await axios.get(`https://api.plugnotas.com.br/nfe/${chave}/xml`, {
          headers: { 'x-api-key': PLUGNOTAS_APIKEY },
          responseType: 'arraybuffer'
        });
        const filePath = path.join(DOWNLOAD_DIR, `${chave}.xml`);
        fs.writeFileSync(filePath, xmlResp.data);
        console.log(`XML salvo: ${filePath}`);
      }
    }
    console.log('Download de todos os XMLs concluído.');
    return { ok: true, message: 'Download concluído.' };
  } catch (err) {
    console.error('Erro:', err.message);
    return { ok: false, error: err.message };
  }
}

// Frontend
app.use('/', express.static(path.join(__dirname, 'public')));

// Endpoint para baixar todos XMLs
app.get('/api/download-all', async (req, res) => {
  const result = await baixarTodosXMLs();
  res.json(result);
});

// Health check
app.get('/api/ping', (req, res) => res.json({ ok: true, mode: MODE }));

app.listen(PORT, () => {
  console.log(`Portal NFe rodando na porta ${PORT} — MODE=${MODE}`);
});

