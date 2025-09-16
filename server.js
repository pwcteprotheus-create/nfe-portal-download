require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Usar porta do Render ou 3000 local
const PORT = process.env.PORT || 3000;

// Diretório para salvar XMLs
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// Modo de operação: MOCK ou PLUGNOTAS
const MODE = process.env.MODE || 'MOCK';

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Função para baixar todos XMLs (MOCK)
async function baixarTodosXMLs() {
  try {
    if (MODE === 'MOCK') {
      for (let i = 1; i <= 5; i++) {
        const chave = String(10000000000000000000000000000000000000000000 + i).slice(-44);
        const xml = sampleXml(chave);
        fs.writeFileSync(path.join(DOWNLOAD_DIR, `${chave}.xml`), xml);
      }
    }
    return { ok: true, message: 'Download concluído.' };
  } catch (err) {
    console.error('Erro ao baixar XMLs:', err.message);
    return { ok: false, error: err.message };
  }
}

// Endpoints
app.get('/api/download-all', async (req, res) => {
  const result = await baixarTodosXMLs();
  res.json(result);
});

app.get('/api/ping', (req, res) => res.json({ ok: true, mode: MODE }));

// Rota default para index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Portal NFe rodando na porta ${PORT} — MODE=${MODE}`);
});
