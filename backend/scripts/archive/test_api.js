const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/public/livros',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const books = JSON.parse(data);
      console.log('✅ Total de livros retornados pela API:', books.length);
      console.log('\n📚 Primeiros 5 livros:');
      books.slice(0, 5).forEach((book, index) => {
        console.log(`  ${index + 1}. "${book.titulo}" - R$ ${book.preco}`);
      });
    } catch (error) {
      console.error('❌ Erro ao parsear JSON:', error.message);
      console.log('Resposta recebida:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.end();
