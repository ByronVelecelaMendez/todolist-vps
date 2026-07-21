require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/tareas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tareas ORDER BY creado_en DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tareas', async (req, res) => {
  const { titulo, descripcion } = req.body;
  if (!titulo || titulo.trim() === '') {
    return res.status(400).json({ error: 'El titulo es obligatorio' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO tareas (titulo, descripcion) VALUES ($1, $2) RETURNING *',
      [titulo.trim(), descripcion || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, completada } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tareas SET titulo = COALESCE($1, titulo), descripcion = COALESCE($2, descripcion), completada = COALESCE($3, completada) WHERE id = $4 RETURNING *',
      [titulo, descripcion, completada, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tareas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tareas WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ mensaje: 'Tarea eliminada', tarea: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
