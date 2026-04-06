import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'fivem_logs',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export default pool

// Helper function to execute queries
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

// Helper for single row
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] || null
}

