'use client';

// src/app/acerca/page.js - Página Acerca

export default function AcercaPage() {
  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '1000px',
      margin: '0 auto',
      minHeight: 'calc(100vh - 200px)'
    }}>
      
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          margin: '0 0 20px 0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎭 Acerca de Mi Trabajo
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666', 
          margin: '0',
          lineHeight: '1.6'
        }}>
          Descubre la pasión detrás de cada sesión audiovisual
        </p>
      </header>

      {/* Sección principal */}
      <section style={{ marginBottom: '50px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }}>
          
          {/* Información personal */}
          <div style={{
            padding: '30px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '1.5rem',
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              👨‍💼 Mi Historia
            </h2>
            <p style={{ 
              margin: '0 0 15px 0', 
              color: '#5a6c7d',
              lineHeight: '1.6'
            }}>
              Soy un apasionado del mundo audiovisual con más de [X] años de experiencia 
              capturando momentos únicos y creando contenido visual que cuenta historias.
            </p>
            <p style={{ 
              margin: '0', 
              color: '#5a6c7d',
              lineHeight: '1.6'
            }}>
              Cada sesión es una oportunidad de explorar nuevas perspectivas y técnicas, 
              siempre buscando la excelencia en cada frame.
            </p>
          </div>

          {/* Especialidades */}
          <div style={{
            padding: '30px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '1.5rem',
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎯 Especialidades
            </h2>
            <ul style={{ 
              margin: '0', 
              padding: '0',
              listStyle: 'none'
            }}>
              <li style={{ 
                margin: '0 0 15px 0',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #667eea'
              }}>
                <strong>📸 Fotografía de Retrato</strong>
                <br />
                <small style={{ color: '#666' }}>Capturando la esencia de cada persona</small>
              </li>
              <li style={{ 
                margin: '0 0 15px 0',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #764ba2'
              }}>
                <strong>🎥 Producción Audiovisual</strong>
                <br />
                <small style={{ color: '#666' }}>Videos que cuentan historias</small>
              </li>
              <li style={{ 
                margin: '0 0 15px 0',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #48cae4'
              }}>
                <strong>🎨 Dirección Creativa</strong>
                <br />
                <small style={{ color: '#666' }}>Conceptualización y ejecución</small>
              </li>
              <li style={{ 
                margin: '0',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #06ffa5'
              }}>
                <strong>✨ Post-Producción</strong>
                <br />
                <small style={{ color: '#666' }}>Edición y efectos visuales</small>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Filosofía de trabajo */}
      <section style={{ marginBottom: '50px' }}>
        <div style={{
          padding: '40px',
          backgroundColor: '#667eea',
          color: 'white',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            margin: '0 0 25px 0', 
            fontSize: '2rem'
          }}>
            💭 Mi Filosofía
          </h2>
          <blockquote style={{
            margin: '0',
            fontSize: '1.3rem',
            fontStyle: 'italic',
            lineHeight: '1.6',
            maxWidth: '700px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            "Cada imagen tiene una historia que contar, cada momento capturado 
            es una ventana al alma. Mi trabajo es encontrar esa conexión única 
            entre el arte y la emoción."
          </blockquote>
        </div>
      </section>

      {/* Tecnología y herramientas */}
      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ 
          margin: '0 0 30px 0', 
          fontSize: '2rem',
          color: '#2c3e50',
          textAlign: 'center'
        }}>
          🛠️ Herramientas y Tecnología
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '25px'
        }}>
          <div style={{
            padding: '25px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>📷</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Fotografía</h3>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              Canon EOS R5, Sony A7IV, Lentes profesionales
            </p>
          </div>

          <div style={{
            padding: '25px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>🎬</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Video</h3>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              BlackMagic, DJI Ronin, Iluminación profesional
            </p>
          </div>

          <div style={{
            padding: '25px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '15px' }}>💻</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Software</h3>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              Adobe Creative Suite, DaVinci Resolve, Capture One
            </p>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section style={{
        padding: '40px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #dee2e6',
        textAlign: 'center'
      }}>
        <h2 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '1.8rem',
          color: '#2c3e50'
        }}>
          📞 ¿Interesado en colaborar?
        </h2>
        <p style={{ 
          margin: '0 0 25px 0', 
          color: '#5a6c7d',
          fontSize: '1.1rem',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          Siempre estoy abierto a nuevos proyectos y colaboraciones creativas. 
          ¡Hablemos sobre tu próxima sesión!
        </p>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <a
            href="mailto:contacto@miportafolio.com"
            style={{
              padding: '12px 24px',
              backgroundColor: '#667eea',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.3s'
            }}
            className="hover-button"
          >
            📧 Email
          </a>
          
          <a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '12px 24px',
              backgroundColor: '#25d366',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.3s'
            }}
            className="hover-button"
          >
            📱 WhatsApp
          </a>
        </div>
      </section>

      {/* CSS interno para efectos hover */}
      <style jsx>{`
        .hover-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}