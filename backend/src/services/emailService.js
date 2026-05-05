// Arquivo: backend/src/services/emailService.js (Versão Final Corrigida)

const nodemailer = require('nodemailer');

// --- AQUI ESTÁ A CORREÇÃO ---
// Garantimos que a porta seja lida como um número
const mailPort = parseInt(process.env.MAIL_PORT || '587', 10);

// Criamos o objeto de configuração do transportador
const transportConfig = {
  host: process.env.MAIL_HOST,
  port: mailPort,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
};

console.log("\n[DEBUG] Configuração do Nodemailer:", { 
    host: transportConfig.host, 
    port: transportConfig.port, 
    user: transportConfig.auth.user ? 'Usuário OK' : '!!! USUÁRIO VAZIO !!!',
    pass: transportConfig.auth.pass ? 'Senha OK' : '!!! SENHA VAZIA !!!',
});

const transporter = nodemailer.createTransport(transportConfig);


const sendRegistrationEmail = async (userEmail, userName, userId) => {
  console.log(`[Mailtrap] Tentando enviar email de boas-vindas para ${userEmail}...`);

  const mailOptions = {
    from: '"Biblioteca Bibliotech" <boasvindas@bibliotech.com>',
    to: userEmail,
    subject: '✅ Cadastro Realizado com Sucesso | Bibliotech',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #0056b3;">Olá, ${userName}!</h2>
        <p>Seu cadastro na plataforma Bibliotech foi um sucesso!</p>
        <p>Este é um email de teste capturado pelo Mailtrap.</p>
        <p>Seu ID de usuário para referência futura é:</p>
        <p style="background-color: #f0f0f0; border-left: 4px solid #0056b3; padding: 12px; font-size: 16px; font-family: monospace;">${userId}</p>
        <br>
        <p>Atenciosamente,</p>
        <p><strong>Equipe Bibliotech</strong></p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailtrap] Email capturado com sucesso! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("[ERRO Mailtrap] Falha ao enviar o email:", error);
  }
};

module.exports = {
  sendRegistrationEmail,
};