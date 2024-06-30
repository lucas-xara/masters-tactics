const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/proxy', createProxyMiddleware({
  target: 'https://feheroes.fandom.com',
  changeOrigin: true,
  pathRewrite: {
    '^/proxy': '', // remove '/proxy' from the URL
  },
  onProxyReq: (proxyReq, req, res) => {
    proxyReq.setHeader('origin', 'https://feheroes.fandom.com');
  }
}));

app.use(express.static('public')); // Assuming your front-end files are in 'public' folder

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
