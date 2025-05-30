// src/app/layout.js - Layout principal para App Router

// import '../styles/index.css' // Comentado temporalmente

export const metadata = {
  title: 'Mi Portafolio Audiovisual',
  description: 'Portafolio audiovisual con galería de sesiones',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body style={{ 
        margin: 0, 
        padding: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Navegación */}
        <nav style={{
          padding: '15px 20px',
          backgroundColor: '#2c3e50',
          color: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <a href="/" style={{ 
              color: 'white', 
              textDecoration: 'none',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}>
              🎬 Portafolio
            </a>
            
            <div style={{ display: 'flex', gap: '20px' }}>
              <a href="/" style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 15px',
                borderRadius: '4px',
                transition: 'background-color 0.3s'
              }}>
                Inicio
              </a>
              <a href="/acerca" style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 15px',
                borderRadius: '4px',
                transition: 'background-color 0.3s'
              }}>
                Acerca
              </a>
              <a href="/configuracion" style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '8px 15px',
                borderRadius: '4px',
                transition: 'background-color 0.3s'
              }}>
                Configuración
              </a>
            </div>
          </div>
        </nav>

        {/* Contenido principal */}
        <main>
          {children}
        </main>

        {/* Footer global */}
        <footer style={{
          marginTop: '60px',
          padding: '30px 20px',
          backgroundColor: '#34495e',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <p style={{ margin: '0 0 10px 0' }}>
              🎬 Mi Portafolio Audiovisual
            </p>
            <p style={{ margin: '0', fontSize: '14px', opacity: 0.8 }}>
              Powered by Next.js + Node.js + PostgreSQL
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}