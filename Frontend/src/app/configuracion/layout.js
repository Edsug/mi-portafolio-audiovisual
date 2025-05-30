// src/app/configuracion/layout.js - Layout específico para Configuración

import Head from 'next/head';

export const metadata = {
  title: 'Configuración - Mi Portafolio Audiovisual',
  description: 'Panel de administración para gestionar sesiones y contenido',
}

export default function ConfiguracionLayout({ children }) {
  return (
    <>
      <Head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </Head>
      {children}
    </>
  );
}