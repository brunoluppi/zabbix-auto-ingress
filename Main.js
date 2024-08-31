const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT;
const sslOptions = {
  key: fs.readFileSync('./cert/zabbix-api.key'),
  cert: fs.readFileSync('./cert/zabbix-api.crt')
};

app.use(bodyParser.json());

app.post('/api/machines', async (req, res) => {
  try {
    const { hostname, psk, uuid, groupid, templateid } = req.body;

    const zabbixUrl = process.env.ZABBIX_URL;
    const zabbixAuthToken = process.env.ZABBIX_AUTH_TOKEN;

    const response = await axios.post(
      zabbixUrl,
      {
        jsonrpc: '2.0',
        method: 'host.create',
        params: {
          host: hostname,
          groups: [{ groupid }],
          templates: [{ templateid }],
          tls_connect: 2,
          tls_accept: 2,
          tls_psk_identity: uuid,
          tls_psk: psk,
        },
        auth: zabbixAuthToken,
        id: 1,
      }
    );

    if (response.data.result && response.data.result.hostids) {
      console.log('Machine registered in Zabbix:', response.data.result.hostids);
      res.status(201).json({ success: true, message: 'Machine registered in Zabbix' });
    } else {
      console.error('Failed to create Zabbix host:', response.data.error);
      res.status(500).json({ success: false, error: response.data.error });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'An error occurred' });
  }
});

const httpsServer = require('https').createServer(sslOptions, app);
  httpsServer.listen(port, () => {
    console.log(`Server is running on port ${port} with HTTPS`);
  });