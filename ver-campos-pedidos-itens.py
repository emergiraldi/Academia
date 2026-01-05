import sys, codecs, fdb
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'ignore')

con = fdb.connect(database=r'C:\QRSistema\db\QRSISTEMA.FDB', user='sysdba', password='masterkey')
cur = con.cursor()
cur.execute("SELECT RDB$FIELD_NAME FROM RDB$RELATION_FIELDS WHERE RDB$RELATION_NAME = 'PEDIDOS_ITENS' ORDER BY RDB$FIELD_POSITION")
print("Campos da tabela PEDIDOS_ITENS:")
for row in cur.fetchall():
    print(f"  {row[0].strip()}")
con.close()
