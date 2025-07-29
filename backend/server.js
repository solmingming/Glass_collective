// backend/server.js
const express = require('express');
const cors = require('cors');
const daoList = require('./daoData');

const app = express();
app.use(cors());

// 전체 DAO 리스트
app.get('/api/daos', (req, res) => {
  res.json(daoList);
});

// 특정 DAO 정보
app.get('/api/daos/:id', (req, res) => {
  const dao = daoList.find(d => d.id.toLowerCase() === req.params.id.toLowerCase());
  if (!dao) return res.status(404).json({ error: 'DAO not found' });
  res.json(dao);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});