import React from 'react';

// Ilustração de pessoa lendo - similar à imagem que você enviou
export const ReadingPersonIllustration = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 800 600"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Estante de Livros */}
    <g id="bookshelf">
      {/* Estrutura da estante */}
      <rect x="50" y="100" width="280" height="400" fill="#1E88E5" opacity="0.9" rx="8" />

      {/* Prateleiras */}
      <rect x="70" y="140" width="240" height="4" fill="#0D47A1" />
      <rect x="70" y="240" width="240" height="4" fill="#0D47A1" />
      <rect x="70" y="340" width="240" height="4" fill="#0D47A1" />
      <rect x="70" y="440" width="240" height="4" fill="#0D47A1" />

      {/* Livros na prateleira 1 */}
      <rect x="80" y="110" width="20" height="30" fill="#90CAF9" />
      <rect x="105" y="110" width="25" height="30" fill="#64B5F6" />
      <rect x="135" y="110" width="22" height="30" fill="#42A5F5" />
      <rect x="162" y="110" width="28" height="30" fill="#2196F3" />
      <rect x="195" y="110" width="24" height="30" fill="#1E88E5" />
      <rect x="224" y="110" width="26" height="30" fill="#1976D2" />
      <rect x="255" y="110" width="20" height="30" fill="#1565C0" />

      {/* Livros na prateleira 2 */}
      <rect x="80" y="210" width="24" height="30" fill="#E3F2FD" />
      <rect x="109" y="210" width="21" height="30" fill="#BBDEFB" />
      <rect x="135" y="210" width="27" height="30" fill="#90CAF9" />
      <rect x="167" y="210" width="23" height="30" fill="#64B5F6" />
      <rect x="195" y="210" width="25" height="30" fill="#42A5F5" />
      <rect x="225" y="210" width="24" height="30" fill="#2196F3" />
      <rect x="254" y="210" width="22" height="30" fill="#1E88E5" />

      {/* Livros na prateleira 3 */}
      <rect x="80" y="310" width="26" height="30" fill="#1976D2" />
      <rect x="111" y="310" width="22" height="30" fill="#1565C0" />
      <rect x="138" y="310" width="25" height="30" fill="#0D47A1" />
      <rect x="168" y="310" width="24" height="30" fill="#82B1FF" />
      <rect x="197" y="310" width="28" height="30" fill="#448AFF" />
      <rect x="230" y="310" width="23" height="30" fill="#2979FF" />
      <rect x="258" y="310" width="20" height="30" fill="#2962FF" />

      {/* Livros na prateleira 4 */}
      <rect x="80" y="410" width="23" height="30" fill="#90CAF9" />
      <rect x="108" y="410" width="26" height="30" fill="#64B5F6" />
      <rect x="139" y="410" width="24" height="30" fill="#42A5F5" />
      <rect x="168" y="410" width="27" height="30" fill="#2196F3" />
      <rect x="200" y="410" width="22" height="30" fill="#1E88E5" />
      <rect x="227" y="410" width="25" height="30" fill="#1976D2" />
      <rect x="257" y="410" width="21" height="30" fill="#1565C0" />

      {/* Portas do armário */}
      <rect x="80" y="460" width="100" height="30" fill="#0D47A1" rx="4" />
      <rect x="190" y="460" width="100" height="30" fill="#0D47A1" rx="4" />
      <circle cx="110" cy="475" r="3" fill="#E0E0E0" />
      <circle cx="220" cy="475" r="3" fill="#E0E0E0" />
    </g>

    {/* Luminária */}
    <g id="lamp">
      <ellipse cx="450" cy="180" rx="100" ry="80" fill="#FFF9C4" opacity="0.3" />
      <circle cx="450" cy="120" r="40" fill="#FFF" opacity="0.8" />
      <line x1="450" y1="80" x2="450" y2="30" stroke="#9E9E9E" strokeWidth="3" />
      <rect x="440" y="20" width="20" height="10" fill="#757575" rx="2" />
    </g>

    {/* Poltrona */}
    <g id="chair">
      {/* Base da poltrona */}
      <path
        d="M 420 350 Q 420 330 440 330 L 580 330 Q 600 330 600 350 L 600 480 Q 600 500 580 500 L 440 500 Q 420 500 420 480 Z"
        fill="#78909C"
      />
      {/* Encosto */}
      <path
        d="M 580 330 Q 600 330 600 310 L 600 200 Q 600 180 580 180 L 580 330"
        fill="#607D8B"
      />
      {/* Apoio de braço esquerdo */}
      <rect x="410" y="340" width="30" height="100" fill="#607D8B" rx="4" />
      {/* Apoio de braço direito */}
      <rect x="590" y="340" width="30" height="100" fill="#607D8B" rx="4" />
      {/* Almofada */}
      <ellipse cx="510" cy="380" rx="70" ry="30" fill="#90A4AE" />
      {/* Apoio de pés */}
      <rect x="460" y="510" width="100" height="40" fill="#78909C" rx="6" />
      <rect x="470" y="550" width="80" height="10" fill="#546E7A" rx="4" />
    </g>

    {/* Pessoa lendo */}
    <g id="person">
      {/* Pernas */}
      <path
        d="M 480 420 Q 470 450 460 490"
        stroke="#4A90E2"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 540 420 Q 550 460 560 500"
        stroke="#4A90E2"
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
      />

      {/* Sapatos */}
      <ellipse cx="455" cy="495" rx="20" ry="12" fill="#212121" />
      <ellipse cx="565" cy="505" rx="20" ry="12" fill="#212121" />

      {/* Corpo */}
      <ellipse cx="510" cy="360" rx="50" ry="65" fill="#37474F" />

      {/* Braços */}
      <path
        d="M 470 330 Q 450 350 450 380"
        stroke="#8D6E63"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 550 330 Q 530 350 520 380"
        stroke="#8D6E63"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />

      {/* Livro */}
      <rect x="440" y="370" width="90" height="70" fill="#29B6F6" rx="4" />
      <rect x="445" y="375" width="80" height="60" fill="#E1F5FE" rx="3" />
      <line x1="485" y1="375" x2="485" y2="435" stroke="#B3E5FC" strokeWidth="2" />

      {/* Cabeça */}
      <circle cx="510" cy="290" r="40" fill="#A1887F" />

      {/* Cabelo (coque) */}
      <ellipse cx="510" cy="260" rx="25" ry="30" fill="#212121" />
      <circle cx="525" cy="255" r="18" fill="#212121" />

      {/* Detalhes do rosto */}
      <circle cx="500" cy="285" r="3" fill="#212121" />
      <circle cx="520" cy="285" r="3" fill="#212121" />
      <path d="M 500 300 Q 510 305 520 300" stroke="#212121" strokeWidth="2" fill="none" />
    </g>

    {/* Decorações flutuantes */}
    <g id="floating-elements" opacity="0.6">
      <circle cx="350" cy="100" r="8" fill="#FFB74D" className="animate-float" />
      <circle cx="650" cy="150" r="6" fill="#4FC3F7" className="animate-float" style={{ animationDelay: '1s' }} />
      <circle cx="380" cy="450" r="10" fill="#81C784" className="animate-float" style={{ animationDelay: '2s' }} />
      <circle cx="680" cy="400" r="7" fill="#FF8A65" className="animate-float" style={{ animationDelay: '1.5s' }} />
    </g>
  </svg>
);

// Ilustração de livros empilhados
export const BooksStackIllustration = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 300 300"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Livro 1 (base) */}
    <g transform="translate(50, 200)">
      <rect x="0" y="0" width="200" height="30" fill="#E3F2FD" rx="2" />
      <rect x="5" y="5" width="190" height="20" fill="#BBDEFB" rx="1" />
      <line x1="100" y1="0" x2="100" y2="30" stroke="#90CAF9" strokeWidth="2" />
    </g>

    {/* Livro 2 */}
    <g transform="translate(60, 165)">
      <rect x="0" y="0" width="180" height="35" fill="#C8E6C9" rx="2" />
      <rect x="5" y="5" width="170" height="25" fill="#A5D6A7" rx="1" />
      <line x1="90" y1="0" x2="90" y2="35" stroke="#81C784" strokeWidth="2" />
    </g>

    {/* Livro 3 */}
    <g transform="translate(45, 130)">
      <rect x="0" y="0" width="190" height="35" fill="#FFECB3" rx="2" />
      <rect x="5" y="5" width="180" height="25" fill="#FFE082" rx="1" />
      <line x1="95" y1="0" x2="95" y2="35" stroke="#FFD54F" strokeWidth="2" />
    </g>

    {/* Livro 4 */}
    <g transform="translate(70, 95)">
      <rect x="0" y="0" width="160" height="35" fill="#FFCCBC" rx="2" />
      <rect x="5" y="5" width="150" height="25" fill="#FFAB91" rx="1" />
      <line x1="80" y1="0" x2="80" y2="35" stroke="#FF8A65" strokeWidth="2" />
    </g>

    {/* Livro 5 (topo) */}
    <g transform="translate(55, 60)">
      <rect x="0" y="0" width="170" height="35" fill="#D1C4E9" rx="2" />
      <rect x="5" y="5" width="160" height="25" fill="#B39DDB" rx="1" />
      <line x1="85" y1="0" x2="85" y2="35" stroke="#9575CD" strokeWidth="2" />
    </g>

    {/* Óculos em cima dos livros */}
    <g transform="translate(120, 40)">
      <ellipse cx="0" cy="0" rx="20" ry="15" fill="none" stroke="#424242" strokeWidth="2" />
      <ellipse cx="40" cy="0" rx="20" ry="15" fill="none" stroke="#424242" strokeWidth="2" />
      <line x1="20" y1="0" x2="20" y2="0" stroke="#424242" strokeWidth="2" />
    </g>

    {/* Marcador de livro */}
    <rect x="145" y="75" width="15" height="80" fill="#FF5252" rx="2" />
    <polygon points="152.5,155 145,165 160,165" fill="#FF5252" />
  </svg>
);

// Ilustração de lâmpada/ideia
export const LightBulbIllustration = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 200 200"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Raios de luz */}
    <g opacity="0.6">
      <line x1="100" y1="20" x2="100" y2="5" stroke="#FFC107" strokeWidth="4" strokeLinecap="round" />
      <line x1="140" y1="30" x2="150" y2="20" stroke="#FFC107" strokeWidth="4" strokeLinecap="round" />
      <line x1="160" y1="60" x2="175" y2="55" stroke="#FFC107" strokeWidth="4" strokeLinecap="round" />
      <line x1="160" y1="100" x2="180" y2="100" stroke="#FFC107" strokeWidth="4" strokeLinecap="round" />
      <line x1="60" y1="30" x2="50" y2="20" stroke="#FFC107" strokeWidth="4" strokeLinecap="round" />
      <line x1="40" y1="60" x2="25" y2="55" stroke="#FFC107" strokeWidth="4" strokeLinecap="round" />
      <line x1="40" y1="100" x2="20" y2="100" stroke="#FFC107" strokeWidth="4" strokeLinecap="round" />
    </g>

    {/* Bulbo */}
    <ellipse cx="100" cy="80" rx="50" ry="60" fill="#FFF59D" />
    <ellipse cx="100" cy="80" rx="40" ry="50" fill="#FFF176" />

    {/* Filamento */}
    <path
      d="M 100 50 Q 90 70 100 80 Q 110 70 100 50"
      fill="none"
      stroke="#FFB300"
      strokeWidth="3"
    />

    {/* Base da lâmpada */}
    <rect x="85" y="130" width="30" height="10" fill="#9E9E9E" />
    <rect x="80" y="140" width="40" height="15" fill="#757575" />
    <rect x="85" y="155" width="30" height="8" fill="#616161" />

    {/* Brilho */}
    <circle cx="80" cy="60" r="8" fill="#FFFFFF" opacity="0.8" />
    <circle cx="120" cy="70" r="5" fill="#FFFFFF" opacity="0.6" />
  </svg>
);

// Ilustração de estudante com livros
export const StudentIllustration = ({ className = '' }: { className?: string }) => (
  <svg
    viewBox="0 0 400 400"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Mesa */}
    <rect x="50" y="280" width="300" height="20" fill="#795548" rx="4" />
    <rect x="60" y="300" width="10" height="80" fill="#5D4037" />
    <rect x="330" y="300" width="10" height="80" fill="#5D4037" />

    {/* Laptop */}
    <g>
      <rect x="180" y="240" width="120" height="40" fill="#424242" rx="2" />
      <rect x="185" y="245" width="110" height="30" fill="#E3F2FD" rx="1" />
      <rect x="180" y="280" width="120" height="5" fill="#212121" />
    </g>

    {/* Livros na mesa */}
    <rect x="80" y="250" width="60" height="30" fill="#4CAF50" rx="2" />
    <rect x="300" y="255" width="40" height="25" fill="#FF5722" rx="2" />

    {/* Xícara de café */}
    <ellipse cx="320" cy="270" rx="12" ry="8" fill="#8D6E63" />
    <rect x="308" y="255" width="24" height="15" fill="#6D4C41" rx="2" />
    <path d="M 332 260 Q 340 260 340 265 Q 340 270 332 270" fill="none" stroke="#6D4C41" strokeWidth="2" />

    {/* Pessoa */}
    <g transform="translate(200, 150)">
      {/* Corpo */}
      <ellipse cx="0" cy="60" rx="40" ry="50" fill="#2196F3" />

      {/* Cabeça */}
      <circle cx="0" cy="0" r="35" fill="#FFCC80" />

      {/* Cabelo */}
      <path d="M -30 -10 Q -35 -25 -25 -30 Q -10 -35 0 -35 Q 10 -35 25 -30 Q 35 -25 30 -10" fill="#3E2723" />

      {/* Olhos */}
      <circle cx="-10" cy="0" r="3" fill="#212121" />
      <circle cx="10" cy="0" r="3" fill="#212121" />

      {/* Boca sorrindo */}
      <path d="M -10 10 Q 0 15 10 10" fill="none" stroke="#212121" strokeWidth="2" strokeLinecap="round" />

      {/* Braços */}
      <ellipse cx="-45" cy="70" rx="12" ry="35" fill="#FFCC80" transform="rotate(-20 -45 70)" />
      <ellipse cx="45" cy="70" rx="12" ry="35" fill="#FFCC80" transform="rotate(20 45 70)" />
    </g>

    {/* Estrelas/Sparkles ao redor */}
    <g fill="#FFD700" opacity="0.7">
      <polygon points="80,80 85,90 95,90 87,96 90,106 80,100 70,106 73,96 65,90 75,90" />
      <polygon points="320,100 323,107 330,107 324,111 326,118 320,114 314,118 316,111 310,107 317,107" />
      <polygon points="150,60 153,66 159,66 154,70 156,76 150,72 144,76 146,70 141,66 147,66" />
    </g>
  </svg>
);
