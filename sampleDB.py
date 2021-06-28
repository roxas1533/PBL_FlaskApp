import pymysql.cursors

conn = pymysql.connect(
    host="127.0.0.1",
    unix_socket="/var/run/mysqld/mysqld.sock",
    user="root",
    password="root",
    db="sampleDB",
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor,
)

try:
    with conn.cursor() as cursor:
        sql = "SELECT * from members"
        cursor.execute(sql)
        result = cursor.fetchall()
        print(result)
finally:
    conn.close()
