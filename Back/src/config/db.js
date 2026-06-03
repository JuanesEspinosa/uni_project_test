const isMySQL = process.env.DB_TYPE === "mysql";

let pool;
let dbAdapter;

if (isMySQL) {
  const mysql = require("mysql2/promise");
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  dbAdapter = {
    isMySQL: true,
    query: async (sql, params = []) => {
      // Traducir marcadores de posición $1, $2, etc. a ? para MySQL
      const mysqlSql = sql.replace(/\$\d+/g, "?");
      const [result] = await pool.query(mysqlSql, params);

      if (Array.isArray(result)) {
        return { rows: result };
      } else {
        return {
          rows: [],
          insertId: result.insertId,
          affectedRows: result.affectedRows,
        };
      }
    },
    connect: async () => {
      const connection = await pool.getConnection();
      return {
        query: async (sql, params = []) => {
          const mysqlSql = sql.replace(/\$\d+/g, "?");
          const [result] = await connection.query(mysqlSql, params);

          if (Array.isArray(result)) {
            return { rows: result };
          } else {
            return {
              rows: [],
              insertId: result.insertId,
              affectedRows: result.affectedRows,
            };
          }
        },
        release: () => connection.release(),
      };
    },
    end: async () => {
      await pool.end();
    },
  };

  console.log("Database initialized: MySQL");
} else {
  const { Pool } = require("pg");
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  pool.on("error", (err) => {
    console.error("Error inesperado en el pool de PostgreSQL:", err.message);
  });

  dbAdapter = {
    isMySQL: false,
    query: async (sql, params = []) => {
      return await pool.query(sql, params);
    },
    connect: async () => {
      const client = await pool.connect();
      return {
        query: async (sql, params = []) => {
          return await client.query(sql, params);
        },
        release: () => client.release(),
      };
    },
    end: async () => {
      await pool.end();
    },
  };

  console.log("Database initialized: PostgreSQL");
}

module.exports = dbAdapter;
