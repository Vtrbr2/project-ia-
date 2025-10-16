import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout, getAuthHeaders, API_BASE_URL } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPages();
  }, [searchTerm]);

  const fetchPages = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pages?search=${encodeURIComponent(searchTerm)}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPages(data.pages);
      } else {
        console.error('Erro ao carregar páginas');
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pageId) => {
    if (!confirm('Tem certeza que deseja excluir esta página?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/pages/${pageId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setPages(pages.filter(page => page._id !== pageId));
      } else {
        alert('Erro ao excluir página');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao excluir página');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando suas páginas...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Content Manager AI
          </h1>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.875rem' }}>
            Bem-vindo, {user?.username}!
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/editor" className="btn btn-primary">
            + Nova Página
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Search Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Buscar páginas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ maxWidth: '400px' }}
          />
        </div>

        {/* Pages Grid */}
        {pages.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
              {searchTerm ? 'Nenhuma página encontrada' : 'Nenhuma página criada ainda'}
            </h3>
            <p style={{ marginBottom: '2rem', color: 'var(--text-light)' }}>
              {searchTerm ? 'Tente ajustar os termos da busca' : 'Crie sua primeira página para começar'}
            </p>
            <Link to="/editor" className="btn btn-primary">
              Criar Primeira Página
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {pages.map(page => (
              <div key={page._id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1rem'
                  }}>
                    <h3 style={{ 
                      margin: 0,
                      fontSize: '1.125rem',
                      fontWeight: '600'
                    }}>
                      {page.title}
                    </h3>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: page.isPublished ? 'var(--success-color)' : 'var(--warning-color)',
                      color: 'white',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {page.isPublished ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>

                  <div style={{ 
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--bg-color)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-light)'
                    }}>
                      {page.template}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--bg-color)',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-light)'
                    }}>
                      {page.layout}
                    </span>
                  </div>

                  {page.aiMetadata && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '4px',
                        backgroundColor: 'var(--border-color)',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${page.aiMetadata.contentScore}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, 
                            ${page.aiMetadata.contentScore < 50 ? 'var(--error-color)' : 
                              page.aiMetadata.contentScore < 80 ? 'var(--warning-color)' : 
                              'var(--success-color)'})`
                        }}></div>
                      </div>
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-light)',
                        fontWeight: '500'
                      }}>
                        Score: {page.aiMetadata.contentScore}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <Link 
                    to={`/editor/${page._id}`}
                    className="btn btn-secondary"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(page._id)}
                    className="btn btn-danger"
                  >
                    Excluir
                  </button>
                </div>

                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-light)'
                }}>
                  Atualizado em {new Date(page.updatedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
